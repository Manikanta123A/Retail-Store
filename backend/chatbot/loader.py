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

IS_VERCEL = os.environ.get("VERCEL") == "1"

def get_vectorizer():
    global _vectorizer
    if IS_VERCEL: return None
    if _vectorizer is None:
        try:
            import joblib
            _vectorizer = joblib.load(os.path.join(_CHATBOT_MODELS, "vectorizer.joblib"))
        except Exception as e:
            print(f"Vectorizer load error: {e}")
            _vectorizer = False
    return _vectorizer if _vectorizer is not False else None


def get_classifier():
    global _classifier
    if IS_VERCEL: return None
    if _classifier is None:
        try:
            import joblib
            _classifier = joblib.load(os.path.join(_CHATBOT_MODELS, "classifier.joblib"))
        except Exception as e:
            print(f"Classifier load error: {e}")
            _classifier = False
    return _classifier if _classifier is not False else None


def get_ner():
    global _ner
    if _ner is None:
        if IS_VERCEL:
            # Fallback for Vercel
            class MockDoc:
                def __init__(self, text): self.text = text; self.ents = []
                def __call__(self, text): return self
            _ner = MockDoc("")
            return _ner
            
        try:
            import spacy
            _ner = spacy.load(_SPACY_MODEL)
        except Exception as e:
            print(f"CHATBOT NER LOAD ERROR: {e}")
            class MockDoc:
                def __init__(self, text): self.text = text; self.ents = []
                def __call__(self, text): return self
            _ner = MockDoc("")
    return _ner

