import spacy
from spacy.training.example import Example
import random
import os

def train_ner():
    model_dir = os.path.join(os.path.dirname(__file__), "models", "billing_model")
    
    print("Loading existing model...")
    nlp = spacy.load(model_dir)
    
    ner = nlp.get_pipe("ner")
    if "AMOUNT" not in ner.labels:
        ner.add_label("AMOUNT")
        
    # Training Data
    TRAIN_DATA = [
        ("Ashwin items shoes 2, 500 paid", {"entities": [(0, 6, "CUSTOMER"), (13, 18, "ITEM"), (19, 20, "QUANTITY"), (22, 25, "AMOUNT")]}),
        ("create a new bill for Ashwin items shoes , 500 paid", {"entities": [(22, 28, "CUSTOMER"), (35, 40, "ITEM"), (43, 46, "AMOUNT")]}),
        ("generate bill for Ravi 3 shirts 200 received", {"entities": [(18, 22, "CUSTOMER"), (23, 24, "QUANTITY"), (25, 31, "ITEM"), (32, 35, "AMOUNT")]}),
        ("paid 1000 for jeans", {"entities": [(5, 9, "AMOUNT"), (14, 19, "ITEM")]}),
        ("received 1500 from Priya", {"entities": [(9, 13, "AMOUNT"), (19, 24, "CUSTOMER")]}),
        ("Ashwin 500 paid", {"entities": [(0, 6, "CUSTOMER"), (7, 10, "AMOUNT")]}),
        ("make invoice for kanta 4 notebooks 2 pens 50 advance", {"entities": [(17, 22, "CUSTOMER"), (23, 24, "QUANTITY"), (25, 34, "ITEM"), (35, 36, "QUANTITY"), (37, 41, "ITEM"), (42, 44, "AMOUNT")]}),
        ("due of 2000 for ravi", {"entities": [(7, 11, "AMOUNT"), (16, 20, "CUSTOMER")]}),
        ("vishnu 500 received", {"entities": [(0, 6, "CUSTOMER"), (7, 10, "AMOUNT")]}),
        ("received money 800 from pandu", {"entities": [(15, 18, "AMOUNT"), (24, 29, "CUSTOMER")]}),
        ("bill bana do manikanta 3 sarees 2 bangles 100 paid", {"entities": [(13, 22, "CUSTOMER"), (23, 24, "QUANTITY"), (25, 31, "ITEM"), (32, 33, "QUANTITY"), (34, 41, "ITEM"), (42, 45, "AMOUNT")]}),
        ("add stock for 1000 shoes", {"entities": [(14, 18, "QUANTITY"), (19, 24, "ITEM")]}),
        ("restocking 50 jeans", {"entities": [(11, 13, "QUANTITY"), (14, 19, "ITEM")]}),
        ("add 100 sarees in inventory", {"entities": [(4, 7, "QUANTITY"), (8, 14, "ITEM")]}),
        ("add stock 100 Gold chain", {"entities": [(10, 13, "QUANTITY"), (14, 24, "ITEM")]}),
    ]

    optimizer = nlp.resume_training()
    
    print("Training the model...")
    for itn in range(30):
        random.shuffle(TRAIN_DATA)
        losses = {}
        for text, annotations in TRAIN_DATA:
            doc = nlp.make_doc(text)
            example = Example.from_dict(doc, annotations)
            nlp.update(
                [example],
                drop=0.35,
                sgd=optimizer,
                losses=losses,
            )
        print(f"Iteration {itn} Losses:", losses)
        
    print("Saving updated model...")
    nlp.to_disk(model_dir)
    print("Model saved to", model_dir)

if __name__ == "__main__":
    train_ner()
