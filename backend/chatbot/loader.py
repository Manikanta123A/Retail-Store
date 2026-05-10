"""
chatbot/loader.py
-----------------
Loads the pretrained models once at startup and exposes them as singletons.

Models:
  - TF-IDF vectorizer   → backend/models/chatbot/vectorizer.joblib
  - Intent classifier   → backend/models/chatbot/classifier.joblib
  - spaCy NER model     → backend/models/billing_model/
"""

import os
import joblib

# ─────────────────────────────────────────────────────────────────────────────
# Paths (relative to this file's directory, i.e. backend/chatbot/)
# ─────────────────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.dirname(__file__))  # backend/
_CHATBOT_MODELS = os.path.join(_BASE, "models", "chatbot")
_SPACY_MODEL    = os.path.join(_BASE, "models", "billing_model")

# ─────────────────────────────────────────────────────────────────────────────
# Lazy singletons
# ─────────────────────────────────────────────────────────────────────────────
_vectorizer  = None
_classifier  = None
_ner         = None


def get_vectorizer():
    global _vectorizer
    if _vectorizer is None:
        _vectorizer = joblib.load(os.path.join(_CHATBOT_MODELS, "vectorizer.joblib"))
    return _vectorizer


def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = joblib.load(os.path.join(_CHATBOT_MODELS, "classifier.joblib"))
    return _classifier


def get_ner():
    global _ner
    if _ner is None:
        import spacy
        _ner = spacy.load(_SPACY_MODEL)
    return _ner
