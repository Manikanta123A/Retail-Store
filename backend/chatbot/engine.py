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

from chatbot.loader    import get_vectorizer, get_classifier, get_ner
from chatbot.extractor import extract_entities
from chatbot.actions   import (
    action_create_customer,
    action_create_bill,
    action_collect_payment,
    action_query_customer,
    action_query_product,
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
}

# Minimum confidence below which we ask for clarification
_MIN_CONFIDENCE = 0.40


def handle_query(text: str, user_id: str) -> dict:
    """
    Main entry point.

    Returns:
        {
            "intent":     str,
            "confidence": float,
            "entities":   dict,
            "response":   str,
        }
    """
    if not text or not text.strip():
        return {
            "intent": "UNKNOWN",
            "confidence": 0.0,
            "entities": {},
            "response": "Please type a message so I can help you."
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
                "- 'price of jeans'"
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
