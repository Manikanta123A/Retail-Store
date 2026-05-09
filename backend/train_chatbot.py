"""
Chatbot Intent Classifier — Training Script
============================================
Run this file once to train the TF-IDF + Logistic Regression model and
persist both the vectorizer and the classifier to disk.

Usage:
    python backend/train_chatbot.py

Outputs (saved to  backend/models/chatbot/):
    - vectorizer.joblib   (TfidfVectorizer)
    - classifier.joblib   (LogisticRegression)
    - label_classes.json  (list of intent labels for reference)
"""

import os
import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# ──────────────────────────────────────────────
# 1.  DATASET
# ──────────────────────────────────────────────
dataset = [

    # -------- CREATE_BILL --------
    {"text": "create a bill for ashwin 2 shoes 5 shirts", "label": "CREATE_BILL"},
    {"text": "generate bill for manikanta 8 tshirts", "label": "CREATE_BILL"},
    {"text": "bill for devansh 3 jeans 2 jackets", "label": "CREATE_BILL"},
    {"text": "make invoice for abhinav 4 notebooks 2 pens", "label": "CREATE_BILL"},
    {"text": "create bill vishnu 2 sandals 3 belts", "label": "CREATE_BILL"},
    {"text": "2500 balloons 67 bangles for ashwin generate bill", "label": "CREATE_BILL"},
    {"text": "invoice for customer ravi 2 chairs 1 table", "label": "CREATE_BILL"},
    {"text": "bill bana do manikanta 3 sarees 2 bangles", "label": "CREATE_BILL"},
    {"text": "generate invoice quickly for ashwin items shoes 2 shirts 5", "label": "CREATE_BILL"},
    {"text": "create bill for order ashwin items listed above", "label": "CREATE_BILL"},

    # -------- CREATE_CUSTOMER --------
    {"text": "add devansh 8247364575", "label": "CREATE_CUSTOMER"},
    {"text": "create customer ashwin 9876543210", "label": "CREATE_CUSTOMER"},
    {"text": "register new customer manikanta 9000012345", "label": "CREATE_CUSTOMER"},
    {"text": "add abhinav phone 9123456780 email abhinav@gmail.com", "label": "CREATE_CUSTOMER"},
    {"text": "new customer entry vishnu 9988776655", "label": "CREATE_CUSTOMER"},
    {"text": "save customer ravi 9011223344 ravi@mail.com", "label": "CREATE_CUSTOMER"},
    {"text": "insert customer pandu 9090909090 pandu@gmail.com", "label": "CREATE_CUSTOMER"},
    {"text": "add user karthik 9345678123", "label": "CREATE_CUSTOMER"},
    {"text": "create new client sneha 9876501234", "label": "CREATE_CUSTOMER"},
    {"text": "add customer details yamini phone 9012345678", "label": "CREATE_CUSTOMER"},

    # -------- COLLECT_PAYMENT --------
    {"text": "collect 8900 from abhinav", "label": "COLLECT_PAYMENT"},
    {"text": "vishnu paid 500", "label": "COLLECT_PAYMENT"},
    {"text": "1000 paid by ash", "label": "COLLECT_PAYMENT"},
    {"text": "received 2500 from ashwin", "label": "COLLECT_PAYMENT"},
    {"text": "payment of 4000 from manikanta", "label": "COLLECT_PAYMENT"},
    {"text": "collect amount 700 from ravi", "label": "COLLECT_PAYMENT"},
    {"text": "received money 800 from pandu", "label": "COLLECT_PAYMENT"},
    {"text": "ashwin gave 1500", "label": "COLLECT_PAYMENT"},
    {"text": "payment received 2000", "label": "COLLECT_PAYMENT"},
    {"text": "customer paid 3000", "label": "COLLECT_PAYMENT"},

    # -------- QUERY_CUSTOMER --------
    {"text": "tell me about pandu", "label": "QUERY_CUSTOMER"},
    {"text": "show customer details of ashwin", "label": "QUERY_CUSTOMER"},
    {"text": "get info of manikanta", "label": "QUERY_CUSTOMER"},
    {"text": "find customer abhinav details", "label": "QUERY_CUSTOMER"},
    {"text": "customer history of vishnu", "label": "QUERY_CUSTOMER"},
    {"text": "details of ravi", "label": "QUERY_CUSTOMER"},
    {"text": "show details of kanta", "label": "QUERY_CUSTOMER"},
    {"text": "show full info of pandu including phone", "label": "QUERY_CUSTOMER"},
    {"text": "display customer data for sneha", "label": "QUERY_CUSTOMER"},
    {"text": "who is yamini", "label": "QUERY_CUSTOMER"},
    {"text": "get customer profile karthik", "label": "QUERY_CUSTOMER"},

    # -------- DELETE_CUSTOMER --------
    {"text": "delete ravi and 9876543210", "label": "DELETE_CUSTOMER"},
    {"text": "remove customer kanta 9000012345", "label": "DELETE_CUSTOMER"},
    {"text": "delete ashwin 9876543210", "label": "DELETE_CUSTOMER"},
    {"text": "delete customer manikanta 9123456780", "label": "DELETE_CUSTOMER"},
    {"text": "remove ravi 9011223344 from database", "label": "DELETE_CUSTOMER"},
    {"text": "delete pandu and 9090909090", "label": "DELETE_CUSTOMER"},
    {"text": "remove user karthik 9345678123", "label": "DELETE_CUSTOMER"},
    {"text": "delete profile of sneha 9876501234", "label": "DELETE_CUSTOMER"},
    {"text": "remove client yamini 9012345678", "label": "DELETE_CUSTOMER"},
    {"text": "delete ravi and 9123456789", "label": "DELETE_CUSTOMER"},

    # -------- QUERY_PRODUCT --------
    {"text": "tell about the shoe", "label": "QUERY_PRODUCT"},
    {"text": "what is price of shirt", "label": "QUERY_PRODUCT"},
    {"text": "show product details for bangles", "label": "QUERY_PRODUCT"},
    {"text": "get info about shoes", "label": "QUERY_PRODUCT"},
    {"text": "product details of saree", "label": "QUERY_PRODUCT"},
    {"text": "price of jeans", "label": "QUERY_PRODUCT"},
    {"text": "what is cost of jacket", "label": "QUERY_PRODUCT"},
    {"text": "show me details of pen", "label": "QUERY_PRODUCT"},
    {"text": "tell product info lipstick", "label": "QUERY_PRODUCT"},
    {"text": "what items are available", "label": "QUERY_PRODUCT"},

    # -------- CREATE_BILL (batch 2) --------
    {"text": "ashwin wants 2 shoes and 5 shirts put that into invoice", "label": "CREATE_BILL"},
    {"text": "for manikanta 8 tshirts prepare billing", "label": "CREATE_BILL"},
    {"text": "items 3 jeans 2 jackets devansh make the bill", "label": "CREATE_BILL"},
    {"text": "abhinav bought 4 notebooks and 2 pens generate invoice now", "label": "CREATE_BILL"},
    {"text": "vishnu order sandals 2 belts 3 convert to bill", "label": "CREATE_BILL"},
    {"text": "ashwin 67 bangles 2500 balloons billing needed", "label": "CREATE_BILL"},
    {"text": "ravi table 1 chair 2 add into billing system", "label": "CREATE_BILL"},
    {"text": "manikanta sarees 3 bangles 2 need invoice", "label": "CREATE_BILL"},
    {"text": "order for ashwin shoes shirts create billing entry", "label": "CREATE_BILL"},
    {"text": "list items and finalize bill for ashwin", "label": "CREATE_BILL"},

    # -------- CREATE_CUSTOMER (batch 2) --------
    {"text": "devansh contact 8247364575 save this person", "label": "CREATE_CUSTOMER"},
    {"text": "ashwin number 9876543210 new entry", "label": "CREATE_CUSTOMER"},
    {"text": "manikanta 9000012345 should be added as client", "label": "CREATE_CUSTOMER"},
    {"text": "abhinav phone 9123456780 email abhinav@gmail.com store details", "label": "CREATE_CUSTOMER"},
    {"text": "vishnu 9988776655 include in customers", "label": "CREATE_CUSTOMER"},
    {"text": "ravi mail ravi@mail.com phone 9011223344 save record", "label": "CREATE_CUSTOMER"},
    {"text": "pandu 9090909090 pandu@gmail.com add this profile", "label": "CREATE_CUSTOMER"},
    {"text": "karthik number 9345678123 create profile", "label": "CREATE_CUSTOMER"},
    {"text": "sneha 9876501234 register this contact", "label": "CREATE_CUSTOMER"},
    {"text": "yamini phone 9012345678 keep in database", "label": "CREATE_CUSTOMER"},

    # -------- COLLECT_PAYMENT (batch 2) --------
    {"text": "abhinav cleared 8900", "label": "COLLECT_PAYMENT"},
    {"text": "vishnu settled 500", "label": "COLLECT_PAYMENT"},
    {"text": "ash completed payment 1000", "label": "COLLECT_PAYMENT"},
    {"text": "ashwin transferred 2500", "label": "COLLECT_PAYMENT"},
    {"text": "manikanta cleared dues 4000", "label": "COLLECT_PAYMENT"},
    {"text": "ravi settled amount 700", "label": "COLLECT_PAYMENT"},
    {"text": "pandu completed transaction 800", "label": "COLLECT_PAYMENT"},
    {"text": "ashwin amount done 1500", "label": "COLLECT_PAYMENT"},
    {"text": "transaction complete 2000", "label": "COLLECT_PAYMENT"},
    {"text": "payment finished 3000", "label": "COLLECT_PAYMENT"},

    # -------- QUERY_CUSTOMER (batch 2) --------
    {"text": "pandu details", "label": "QUERY_CUSTOMER"},
    {"text": "ashwin info", "label": "QUERY_CUSTOMER"},
    {"text": "manikanta profile", "label": "QUERY_CUSTOMER"},
    {"text": "abhinav data", "label": "QUERY_CUSTOMER"},
    {"text": "vishnu record", "label": "QUERY_CUSTOMER"},
    {"text": "ravi account", "label": "QUERY_CUSTOMER"},
    {"text": "pandu phone and history", "label": "QUERY_CUSTOMER"},
    {"text": "sneha full record", "label": "QUERY_CUSTOMER"},
    {"text": "yamini who", "label": "QUERY_CUSTOMER"},
    {"text": "karthik customer info", "label": "QUERY_CUSTOMER"},

    # -------- QUERY_PRODUCT (batch 2) --------
    {"text": "shoe details", "label": "QUERY_PRODUCT"},
    {"text": "shirt price", "label": "QUERY_PRODUCT"},
    {"text": "bangles information", "label": "QUERY_PRODUCT"},
    {"text": "about shoes", "label": "QUERY_PRODUCT"},
    {"text": "saree cost", "label": "QUERY_PRODUCT"},
    {"text": "jeans rate", "label": "QUERY_PRODUCT"},
    {"text": "jacket pricing", "label": "QUERY_PRODUCT"},
    {"text": "pen info", "label": "QUERY_PRODUCT"},
    {"text": "lipstick details", "label": "QUERY_PRODUCT"},
    {"text": "available items list", "label": "QUERY_PRODUCT"},

    # -------- CREATE_BILL (batch 3 — mixed punctuation / formats) --------
    {"text": "ashwin -> shoes 2, shirts 5 -> invoice", "label": "CREATE_BILL"},
    {"text": "invoice: manikanta | tshirts=8", "label": "CREATE_BILL"},
    {"text": "devansh jeans 3 jackets 2 bill", "label": "CREATE_BILL"},
    {"text": "4 notebooks + 2 pens abhinav billing", "label": "CREATE_BILL"},
    {"text": "vishnu sandals:2 belts:3 make entry", "label": "CREATE_BILL"},
    {"text": "bangles 67 balloons 2500 ashwin bill it", "label": "CREATE_BILL"},
    {"text": "ravi chair 2 table 1 -> bill", "label": "CREATE_BILL"},
    {"text": "manikanta | saree 3 | bangle 2 | process", "label": "CREATE_BILL"},
    {"text": "items(shoes shirts) user=ashwin finalize", "label": "CREATE_BILL"},
    {"text": "bill? ashwin items already listed", "label": "CREATE_BILL"},

    # -------- CREATE_CUSTOMER (batch 3) --------
    {"text": "devansh : 8247364575", "label": "CREATE_CUSTOMER"},
    {"text": "ashwin | 9876543210 | save", "label": "CREATE_CUSTOMER"},
    {"text": "client -> manikanta -> 9000012345", "label": "CREATE_CUSTOMER"},
    {"text": "abhinav,9123456780,abhinav@gmail.com", "label": "CREATE_CUSTOMER"},
    {"text": "vishnu number=9988776655 store", "label": "CREATE_CUSTOMER"},
    {"text": "ravi -> ravi@mail.com -> 9011223344", "label": "CREATE_CUSTOMER"},
    {"text": "pandu | 9090909090 | pandu@gmail.com", "label": "CREATE_CUSTOMER"},
    {"text": "karthik 9345678123 add entry", "label": "CREATE_CUSTOMER"},
    {"text": "sneha contact=9876501234", "label": "CREATE_CUSTOMER"},
    {"text": "yamini -> phone 9012345678 -> keep", "label": "CREATE_CUSTOMER"},

    # -------- COLLECT_PAYMENT (batch 3) --------
    {"text": "abhinav -> 8900 cleared", "label": "COLLECT_PAYMENT"},
    {"text": "vishnu : 500 done", "label": "COLLECT_PAYMENT"},
    {"text": "ash 1000 ✔", "label": "COLLECT_PAYMENT"},
    {"text": "2500 <- ashwin", "label": "COLLECT_PAYMENT"},
    {"text": "manikanta : 4000 settled", "label": "COLLECT_PAYMENT"},
    {"text": "ravi amount=700 done", "label": "COLLECT_PAYMENT"},
    {"text": "pandu -> 800 ok", "label": "COLLECT_PAYMENT"},
    {"text": "ashwin paid? 1500 yes", "label": "COLLECT_PAYMENT"},
    {"text": "2000 completed", "label": "COLLECT_PAYMENT"},
    {"text": "3000 ✓ payment", "label": "COLLECT_PAYMENT"},

    # -------- QUERY_CUSTOMER (batch 3) --------
    {"text": "pandu ?", "label": "QUERY_CUSTOMER"},
    {"text": "ashwin ?? info", "label": "QUERY_CUSTOMER"},
    {"text": "manikanta data?", "label": "QUERY_CUSTOMER"},
    {"text": "abhinav -> details", "label": "QUERY_CUSTOMER"},
    {"text": "vishnu profile?", "label": "QUERY_CUSTOMER"},
    {"text": "ravi ???", "label": "QUERY_CUSTOMER"},
    {"text": "pandu history?", "label": "QUERY_CUSTOMER"},
    {"text": "sneha record??", "label": "QUERY_CUSTOMER"},
    {"text": "yamini info??", "label": "QUERY_CUSTOMER"},
    {"text": "karthik -> customer?", "label": "QUERY_CUSTOMER"},

    # -------- QUERY_PRODUCT (batch 3) --------
    {"text": "shoe ?", "label": "QUERY_PRODUCT"},
    {"text": "shirt ?? cost", "label": "QUERY_PRODUCT"},
    {"text": "bangles -> ?", "label": "QUERY_PRODUCT"},
    {"text": "shoes info?", "label": "QUERY_PRODUCT"},
    {"text": "saree ??? price", "label": "QUERY_PRODUCT"},
    {"text": "jeans ??", "label": "QUERY_PRODUCT"},
    {"text": "jacket ?", "label": "QUERY_PRODUCT"},
    {"text": "pen ???", "label": "QUERY_PRODUCT"},
    {"text": "lipstick ?", "label": "QUERY_PRODUCT"},
    {"text": "items ???", "label": "QUERY_PRODUCT"},
]

texts  = [d["text"]  for d in dataset]
labels = [d["label"] for d in dataset]

# ──────────────────────────────────────────────
# 2.  TRAIN / TEST SPLIT
# ──────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, random_state=42, stratify=labels
)

# ──────────────────────────────────────────────
# 3.  VECTORIZE
# ──────────────────────────────────────────────
vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec  = vectorizer.transform(X_test)

# ──────────────────────────────────────────────
# 4.  TRAIN
# ──────────────────────────────────────────────
classifier = LogisticRegression(max_iter=1000, C=5.0, solver="lbfgs")
classifier.fit(X_train_vec, y_train)

# ──────────────────────────────────────────────
# 5.  EVALUATE
# ──────────────────────────────────────────────
y_pred = classifier.predict(X_test_vec)
print("\n===== Classification Report =====")
print(classification_report(y_test, y_pred))

# ──────────────────────────────────────────────
# 6.  SAVE MODEL ARTIFACTS
# ──────────────────────────────────────────────
SAVE_DIR = os.path.join(os.path.dirname(__file__), "models", "chatbot")
os.makedirs(SAVE_DIR, exist_ok=True)

vectorizer_path  = os.path.join(SAVE_DIR, "vectorizer.joblib")
classifier_path  = os.path.join(SAVE_DIR, "classifier.joblib")
labels_path      = os.path.join(SAVE_DIR, "label_classes.json")

joblib.dump(vectorizer, vectorizer_path)
joblib.dump(classifier, classifier_path)

label_classes = sorted(set(labels))
with open(labels_path, "w") as f:
    json.dump(label_classes, f, indent=2)

print(f"\n[OK] Model saved to: {SAVE_DIR}")
print(f"    vectorizer  -> {vectorizer_path}")
print(f"    classifier  -> {classifier_path}")
print(f"    labels      -> {labels_path}")

# ──────────────────────────────────────────────
# 7.  QUICK SANITY CHECK  (reload & predict)
# ──────────────────────────────────────────────
loaded_vec = joblib.load(vectorizer_path)
loaded_clf = joblib.load(classifier_path)

test_sentences = [
    "create bill for rahul 3 shoes",
    "add new customer sita 9988001122",
    "rahul paid 2000",
    "show details of sneha",
    "price of jeans",
]

print("\n===== Sanity-check predictions =====")
for sentence in test_sentences:
    vec  = loaded_vec.transform([sentence])
    pred = loaded_clf.predict(vec)[0]
    conf = loaded_clf.predict_proba(vec).max() * 100
    print(f"  '{sentence}'\n    -> {pred}  ({conf:.1f}% confidence)\n")
