"""
chatbot/extractor.py
---------------------
Extracts structured entities from raw spaCy doc output.

Label conventions (matching billing_model NER labels):
  CUSTOMER  → customer/person name
  ITEM      → product name
  QUANTITY  → numeric count for items
  AMOUNT    → money value OR 10-digit phone number (context-determined)
"""

import re

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE = re.compile(r"\b\d{10}\b")
_DIGIT_RE = re.compile(r"\d+(?:\.\d+)?")


def _clean(text: str) -> str:
    return text.strip()


# ─────────────────────────────────────────────────────────────────────────────
# Core extractor
# ─────────────────────────────────────────────────────────────────────────────
def extract_entities(doc, raw_text: str) -> dict:
    """
    Given a spaCy doc and the original raw text, return a structured entity dict:

    {
        "customer":  str | None,
        "items":     [{"item": str, "qty": int}, ...],
        "amount":    float | None,
        "phone":     str | None,
        "email":     str | None,
        "raw":       { label: [text, ...] }   # raw grouped entities
    }
    """
    raw: dict[str, list[str]] = {}
    for ent in doc.ents:
        raw.setdefault(ent.label_, []).append(_clean(ent.text))

    # ── Email (always via regex on raw text) ─────────────────────────────────
    email_match = _EMAIL_RE.search(raw_text)
    email = email_match.group() if email_match else None

    # ── Phone (always via regex on raw text) ─────────────────────────────────
    phone_match = _PHONE_RE.search(raw_text)
    phone = phone_match.group() if phone_match else None

    customer = raw.get("CUSTOMER", [None])[0]
    
    # Exclude reserved keywords from direct NER capture
    if customer and customer.lower() in {"stock", "items", "inventory", "restock", "bill", "invoice"}:
        customer = None
        
    # Invalidate customer if NER incorrectly captured email or phone as customer
    if customer:
        if _EMAIL_RE.fullmatch(customer) or _PHONE_RE.fullmatch(re.sub(r"[^\d]", "", customer)):
            customer = None
    
    # ── Fallback for Customer Name (If NER fails or misclassifies) ───────────
    if not customer:
        # Check if a QUANTITY, ITEM, or AMOUNT entity is actually a name (matches fallback pattern)
        all_potential_names = raw.get("QUANTITY", []) + raw.get("ITEM", []) + raw.get("AMOUNT", [])
        
        # Pattern-based fallback (e.g., "for Ashwin", "bill for Kanta")
        # First remove email and phone from raw text to avoid extracting parts of them as name
        cleaned_text = raw_text
        if email:
            cleaned_text = cleaned_text.replace(email, "")
        if phone:
            cleaned_text = cleaned_text.replace(phone, "")

        patterns = [
            r"for\s+([a-zA-Z]+)",
            r"bill\s+for\s+([a-zA-Z]+)",
            r"invoice\s+for\s+([a-zA-Z]+)",
            r"about\s+([a-zA-Z]+)",
            r"add\s+(?:customer\s+)?([a-zA-Z]+)",
            r"details\s+of\s+([a-zA-Z]+)",
            r"info\s+of\s+([a-zA-Z]+)",
            r"show\s+(?:details\s+of\s+|info\s+of\s+|customer\s+)?([a-zA-Z]+)",
            r"^([a-zA-Z]+)\s+paid",
            r"delete\s+(?:customer\s+)?([a-zA-Z]+)(?:\s+and\s+\d{10})?",
            r"remove\s+(?:customer\s+)?([a-zA-Z]+)",
            r"due\s+(?:for|of|from)\s+(?:customer\s+)?([a-zA-Z]+)",
            r"(?:customer\s+)?([a-zA-Z]+)\s+(?:has|have)\s+.*due"
        ]
        for p in patterns:
            m = re.search(p, cleaned_text, re.IGNORECASE)
            if m:
                customer = m.group(1).title()
                # Clean up if group captured common words
                customer = re.sub(r'^(Customer|Details|Info|Of|From|About|Remove|Delete)\s+', '', customer, flags=re.IGNORECASE)
                break
        
        if not customer:
            # Keywords that should NEVER be a customer name
            EXCLUSIONS = {"stock", "items", "inventory", "restock", "price", "category", "bill", "invoice"}
            
            for q in all_potential_names:
                if isinstance(q, str) and not re.search(r'\d', q) and len(q) > 2:
                    if q.lower() not in EXCLUSIONS:
                        customer = q
                        break

    items_raw = raw.get("ITEM", [])
    quantities_raw = raw.get("QUANTITY", [])
    amounts_raw = raw.get("AMOUNT", [])

    # ── Item-Quantity sequential mapping (Proximity-based) ───────────────────
    items = []
    
    item_ents = [ent for ent in doc.ents if ent.label_ == "ITEM"]
    # Only treat QUANTITY entities that actually contain digits as quantities
    quant_ents = [ent for ent in doc.ents if ent.label_ == "QUANTITY" and re.search(r'\d', ent.text)]
    
    # Also consider AMOUNT as quantity if it's a simple integer (e.g. "100" mislabeled as AMOUNT)
    for ent in doc.ents:
        if ent.label_ == "AMOUNT" and re.fullmatch(r'\d+', ent.text):
            val = int(ent.text)
            # Heuristic: If it's a whole number and not a phone number, it could be a quantity
            if val < 10000 and not _PHONE_RE.fullmatch(ent.text):
                quant_ents.append(ent)

    used_quants = set()
    
    for item_ent in item_ents:
        item_name = _clean(item_ent.text)
        
        # Skip if this "item" is actually the customer name or a reserved keyword
        if customer and item_name.lower() == customer.lower():
            continue
        if item_name.lower() in {"stock", "restock", "inventory", "item", "items", "add", "for"}:
            continue

        best_qty = 1
        best_dist = float('inf')
        best_q_idx = -1
        
        for q_idx, q_ent in enumerate(quant_ents):
            if q_idx in used_quants:
                continue
                
            # Distance: if q_ent is before item_ent, dist is item_ent.start - q_ent.end
            # if q_ent is after item_ent, dist is q_ent.start - item_ent.end
            if q_ent.end <= item_ent.start:
                dist = item_ent.start - q_ent.end
            else:
                dist = q_ent.start - item_ent.end
                
            if dist < best_dist:
                best_dist = dist
                best_q_idx = q_idx
                
        # If the closest quantity is within a reasonable distance (e.g. 5 tokens)
        if best_q_idx != -1 and best_dist <= 5:
            try:
                # Clean quantity text (remove commas etc)
                q_text = re.sub(r'[^\d.]', '', quant_ents[best_q_idx].text)
                best_qty = int(float(q_text))
                used_quants.add(best_q_idx)
            except:
                pass
                
        items.append({"item": item_name, "qty": best_qty})

    # ── Deduplicate items case-insensitively ──────────────────────────────────
    deduped_items = {}
    for i in items:
        key = i["item"].lower()
        if key in deduped_items:
            deduped_items[key]["qty"] += i["qty"]
        else:
            # Standardize to Title Case for consistency
            deduped_items[key] = {"item": i["item"].title(), "qty": i["qty"]}
    items = list(deduped_items.values())

    # ── Remove customer from items if misclassified ───────────────────────────
    if customer:
        items = [i for i in items if i["item"].lower() != customer.lower()]

    # ── Fallback for Add Stock if NER missed the item/qty entirely ────────────
    if not items and re.search(r'\bstock\b', raw_text, re.IGNORECASE):
        tokens = raw_text.split()
        fallback_qty = None
        item_parts = []
        
        for tok in tokens:
            tok_clean = re.sub(r'[^a-zA-Z0-9]', '', tok)
            if not tok_clean: continue
            
            if tok_clean.lower() in {"add", "stock", "for", "in", "to", "increase", "by", "restock", "items"}:
                continue
            
            if tok_clean.isdigit():
                fallback_qty = int(tok_clean)
            else:
                item_parts.append(tok)
                
        if fallback_qty is not None and item_parts:
            items = [{"item": " ".join(item_parts).title(), "qty": fallback_qty}]
            customer = None  # Clear customer if it wrongly captured 'Stock'
    # ── Amount / Phone separation ─────────────────────────────────────────────
    # Phone is already extracted, but we check if amount captured it
    amount = None

    for val in amounts_raw:
        digits = re.sub(r"[^\d.]", "", val)
        if _PHONE_RE.fullmatch(digits):
            # 10-digit → treat as phone
            if phone is None:
                phone = digits
        else:
            # Otherwise treat as money amount
            try:
                amount = float(digits)
            except ValueError:
                pass

    # ── Fallback: amount from raw text digits if NER missed it ──────────────
    if amount is None:
        for tok in re.findall(r"\b\d+(?:\.\d+)?\b", raw_text):
            try:
                val = float(tok)
                if val > 99 and not _PHONE_RE.fullmatch(tok):
                    amount = val
                    break
            except ValueError:
                pass


    # ── Specific "paid" amount extraction ─────────────────────────────────────
    paid_amount = None
    # Matches "paid 500", "500 paid", "received 500", "500 received", etc.
    paid_match = re.search(r"(?:paid|received|advance)\s*(\d+(?:\.\d{1,2})?)|\b(\d+(?:\.\d{1,2})?)\s*(?:paid|received|advance)", raw_text, re.IGNORECASE)
    if paid_match:
        # group(1) if "paid 500", group(2) if "500 paid"
        val = paid_match.group(1) or paid_match.group(2)
        paid_amount = float(val)

    return {
        "customer":   customer,
        "items":      items,
        "amount":     amount,
        "paid_amount": paid_amount,
        "phone":      phone,
        "email":      email,
        "raw":        raw,
    }
