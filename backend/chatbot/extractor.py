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
    
    # Invalidate customer if NER incorrectly captured email or phone as customer
    if customer:
        if _EMAIL_RE.fullmatch(customer) or _PHONE_RE.fullmatch(re.sub(r"[^\d]", "", customer)):
            customer = None
    
    # ── Fallback for Customer Name (If NER fails or misclassifies) ───────────
    if not customer:
        # Check if a QUANTITY entity is actually a name (non-numeric)
        for q in raw.get("QUANTITY", []):
            if not re.search(r'\d', q):
                customer = q
                break
        
        # Pattern-based fallback (e.g., "for Ashwin", "bill for Kanta")
        if not customer:
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
                r"^([a-zA-Z]+)\s+paid",
                r"delete\s+([a-zA-Z]+)"
            ]
            for p in patterns:
                m = re.search(p, cleaned_text, re.IGNORECASE)
                if m:
                    customer = m.group(1).capitalize()
                    break

    items_raw = raw.get("ITEM", [])
    quantities_raw = raw.get("QUANTITY", [])
    amounts_raw = raw.get("AMOUNT", [])

    # ── Item-Quantity sequential mapping (Proximity-based) ───────────────────
    items = []
    
    item_ents = [ent for ent in doc.ents if ent.label_ == "ITEM"]
    # Only treat QUANTITY entities that actually contain digits as quantities
    quant_ents = [ent for ent in doc.ents if ent.label_ == "QUANTITY" and re.search(r'\d', ent.text)]
    
    used_quants = set()
    
    for item_ent in item_ents:
        item_name = _clean(item_ent.text)
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
                best_qty = int(float(quant_ents[best_q_idx].text))
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
            deduped_items[key] = {"item": i["item"], "qty": i["qty"]}
    items = list(deduped_items.values())

    # ── Remove customer from items if misclassified ───────────────────────────
    if customer:
        items = [i for i in items if i["item"].lower() != customer.lower()]

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

    return {
        "customer": customer,
        "items":    items,
        "amount":   amount,
        "phone":    phone,
        "email":    email,
        "raw":      raw,
    }
