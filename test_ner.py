import sys
import os

sys.path.append(os.path.abspath('backend'))

from chatbot.loader import get_ner
from chatbot.extractor import extract_entities

ner = get_ner()

texts = [
    "Show details of Kanta",
    "Show details of Ravi",
    "bill for Priya 2 shoes",
    "Add Vaishu 9398432494 vaishu@gmail.com",
    "Kanta paid 500",
    "2 bangles and 3 BANGLES for Ravi",
    "Delete Kanta and 9398432494"
]

with open('ner_results_direct.txt', 'w', encoding='utf-8') as f:
    for t in texts:
        doc = ner(t)
        res = extract_entities(doc, t)
        f.write(f"Text: '{t}'\n")
        f.write(f"Customer: {res.get('customer')}\n")
        f.write(f"Items: {res.get('items')}\n")
        f.write("-" * 40 + "\n")
