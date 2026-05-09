"""
routes/chat.py
--------------
Flask blueprint for the /api/chat/ endpoint.
Delegates all intelligence to the local chatbot engine
(intent classifier + spaCy NER) — no external AI API required.
"""

from flask import Blueprint, request, jsonify
from chatbot.engine import handle_query

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/", methods=["POST"])
def chat():
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data    = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Empty message"}), 400

    print(f"CHAT DEBUG: User={user_id}, Msg='{message}'")
    result = handle_query(message, user_id)
    print(f"CHAT DEBUG: Intent={result['intent']}, Conf={result['confidence']}")
    print(f"CHAT DEBUG: Entities={result['entities']}")

    return jsonify({
        "response":   result["response"],
        "intent":     result["intent"],
        "confidence": result["confidence"],
        # Optionally expose raw entities for debugging; front-end can ignore
        "entities":   result["entities"].get("raw", {}),
    })
