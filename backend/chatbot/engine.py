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


def handle_query(text: str, user_id: str) -> dict:
    """
    Main entry point. Handles single or multi-part queries.
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
            res = _process_single_query(p_text, user_id)
            
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

    return _process_single_query(text, user_id)


def _process_single_query(text: str, user_id: str) -> dict:
    """
    Internal logic to process a single intent from a piece of text.
    """
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

    # ── Step 2 & 3: NER + entity extraction ─────────────────────────────────
    ner    = get_ner()
    doc    = ner(text)
    entities = extract_entities(doc, text)

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
