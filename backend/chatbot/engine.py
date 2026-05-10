"""
chatbot/engine.py
------------------
Core chatbot engine.

handle_query(text, user_id) → str
  1. Classify intent with TF-IDF + LogisticRegression
  2. Run spaCy NER
  3. Extract structured entities
  4. Route to the correct action
  5. Return response string
"""

import re
from chatbot.loader    import get_vectorizer, get_classifier, get_ner
from chatbot.extractor import extract_entities
from chatbot.actions   import (
    action_create_customer,
    action_create_bill,
    action_collect_payment,
    action_query_customer,
    action_query_product,
    action_delete_customer,
    action_add_due,
    action_undo
)

# ─────────────────────────────────────────────────────────────────────────────
# Intent → Action router
# ─────────────────────────────────────────────────────────────────────────────
_ROUTER = {
    "CREATE_CUSTOMER":  action_create_customer,
    "CREATE_BILL":      action_create_bill,
    "COLLECT_PAYMENT":  action_collect_payment,
    "QUERY_CUSTOMER":   action_query_customer,
    "QUERY_PRODUCT":    action_query_product,
    "DELETE_CUSTOMER":  action_delete_customer,
    "ADD_DUE":          action_add_due,
    "UNDO":             action_undo,
}

# Minimum confidence below which we ask for clarification
_MIN_CONFIDENCE = 0.40


def handle_query(text: str, user_id: str, history: list = []) -> dict:
    """
    Main entry point. Handles single or multi-part queries with history context.
    """
    if not text or not text.strip():
        return {
            "intent": "UNKNOWN",
            "confidence": 0.0,
            "entities": {},
            "response": "Please type a message so I can help you."
        }

    # ── Step 0.5: Multi-Intent Splitting ─────────────────────────────────────
    # If the text contains a comma and both 'bill' and 'due' keywords, 
    # treat them as separate actions for better reliability as requested.
    if ("," in text or " and " in text.lower()) and ("bill" in text.lower() and "due" in text.lower()):
        if "," in text:
            parts = text.split(",")
        else:
            # Simple heuristic split on 'and'
            parts = re.split(r"\s+and\s+", text, flags=re.IGNORECASE)
        results = []
        all_entities = {}
        shared_customer = None
        
        for p in parts:
            p_text = p.strip()
            if not p_text: continue
            res = _process_single_query(p_text, user_id, history)
            
            # If this part found a customer, save it for subsequent parts
            if res.get("entities", {}).get("customer"):
                shared_customer = res["entities"]["customer"]
            # If this part is missing a customer but we have a shared one, re-run with shared customer
            elif shared_customer and not res.get("entities", {}).get("customer"):
                res["entities"]["customer"] = shared_customer
                # Re-run action with updated entities
                action_fn = _ROUTER.get(res["intent"])
                if action_fn:
                    try:
                        res["response"] = action_fn(res["entities"], user_id)
                    except:
                        pass
            
            results.append(res["response"])
            all_entities.update(res.get("entities", {}))
        
        return {
            "intent": "MULTI_ACTION",
            "confidence": 1.0,
            "entities": all_entities,
            "response": "\n".join(results)
        }

    return _process_single_query(text, user_id, history)


def _process_single_query(text: str, user_id: str, history: list = []) -> dict:
    """
    Internal logic to process a single intent with history for context retrieval.
    """
    from chatbot.actions import PENDING_BILLS, action_create_bill
    if user_id in PENDING_BILLS:
        pending = PENDING_BILLS[user_id]
        customer_name = pending["customer_name"]
        
        lower_text = text.lower().strip()
        if lower_text in ["cancel", "stop", "abort", "no", "exit"]:
            del PENDING_BILLS[user_id]
            return {
                "intent": "CANCEL_PENDING",
                "confidence": 1.0,
                "entities": {},
                "response": f"Bill creation for {customer_name} cancelled."
            }

        import re
        phone_match = re.search(r'\b\d{10}\b', text)
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        
        if phone_match:
            phone = phone_match.group(0)
            email = email_match.group(0) if email_match else None
            
            from models.customer import Customer
            from database import db
            import uuid
            
            existing = Customer.query.filter_by(phone=phone, user_id=user_id).first()
            if existing:
                del PENDING_BILLS[user_id]
                return {
                    "intent": "PROVIDE_DETAILS",
                    "confidence": 1.0,
                    "entities": {},
                    "response": f"A customer with phone {phone} already exists as '{existing.name}'. Bill creation cancelled."
                }
                
            new_cust = Customer(
                id=str(uuid.uuid4()),
                name=customer_name,
                phone=phone,
                email=email,
                user_id=user_id
            )
            db.session.add(new_cust)
            db.session.commit()
            
            entities = pending["entities"]
            del PENDING_BILLS[user_id]
            
            response = action_create_bill(entities, user_id)
            return {
                "intent": "CREATE_BILL_CONTINUED",
                "confidence": 1.0,
                "entities": entities,
                "response": f"Profile created for {customer_name}. " + response
            }
        else:
            return {
                "intent": "WAITING_FOR_DETAILS",
                "confidence": 1.0,
                "entities": {},
                "response": f"Please enter a valid 10-digit mobile number for {customer_name} (and email if available), or type 'cancel' to abort."
            }

    # ── Step 0: Basic Small Talk / Greetings ───────────────────────────────
    greetings = ["hi", "hello", "hey", "good morning", "good evening", "how are you"]
    if any(g == text.lower().strip() for g in greetings):
        return {
            "intent": "GREETING",
            "confidence": 1.0,
            "entities": {},
            "response": "Hello! I'm your Store Assistant. How can I help you manage your shop today?"
        }

    # ── Step 1: Classify intent ──────────────────────────────────────────────
    vec        = get_vectorizer()
    clf        = get_classifier()
    X          = vec.transform([text])
    intent     = clf.predict(X)[0]
    confidence = float(clf.predict_proba(X).max())

    # ── Step 1.5: Manual Overrides ──────────────────────────────────────────
    lower_text = text.lower()
    if lower_text.startswith("delete "):
        intent = "DELETE_CUSTOMER"
        confidence = 1.0
    elif "due" in lower_text and any(c.isdigit() for c in text) and "paid" not in lower_text and "bill" not in lower_text:
        intent = "ADD_DUE"
        confidence = 1.0
    elif lower_text.strip() == "undo":
        intent = "UNDO"
        confidence = 1.0

    if confidence < _MIN_CONFIDENCE:
        return {
            "intent":     "UNKNOWN",
            "confidence": confidence,
            "entities":   {},
            "response":   (
                "I'm not sure what you mean. Try something like:\n"
                "- 'create bill for Ravi 2 shoes'\n"
                "- 'add customer Anita 9876543210'\n"
                "- 'Ravi paid 500'\n"
                "- 'show details of Priya'\n"
                "- 'price of jeans'\n"
                "- 'delete Ravi and 9876543210'"
            ),
        }

    ner    = get_ner()
    doc    = ner(text)
    entities = extract_entities(doc, text)

    # ── Step 3.5: Contextual Recovery ───────────────────────────────────────
    # If customer is missing, look back in history for the last mentioned customer
    if not entities.get("customer") and history:
        # Search from newest to oldest in history
        for msg in reversed(history):
            if msg.get('role') == 'bot' and msg.get('intent') in ['QUERY_CUSTOMER', 'CREATE_BILL', 'COLLECT_PAYMENT', 'CREATE_CUSTOMER']:
                # This is a bit hacky since history doesn't store extracted entities yet, 
                # but we can try to find the customer name in the previous bot response 
                # or just look at the last user message.
                pass 
        
        # Better approach: check the last USER message if it was a customer query
        last_user_msg = next((m for m in reversed(history) if m.get('role') == 'user'), None)
        if last_user_msg:
            # Re-run extraction on the last message to see if it had a customer
            # (Note: This is simplified; ideally we'd store entities in history)
            last_doc = ner(last_user_msg['content'])
            last_entities = extract_entities(last_doc, last_user_msg['content'])
            if last_entities.get("customer"):
                entities["customer"] = last_entities["customer"]
                print(f"CONTEXT RECOVERY: Found customer '{entities['customer']}' from history.")

    # ── Step 4: Route to action ──────────────────────────────────────────────
    action_fn = _ROUTER.get(intent)
    if action_fn is None:
        response = f"I understood '{intent}' but don't know how to handle it yet."
    else:
        try:
            response = action_fn(entities, user_id)
        except Exception as exc:
            response = f"Something went wrong while processing your request: {exc}"

    return {
        "intent":     intent,
        "confidence": round(confidence, 3),
        "entities":   entities,
        "response":   response,
    }
