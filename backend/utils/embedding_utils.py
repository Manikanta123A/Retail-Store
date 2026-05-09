import numpy as np
from sentence_transformers import SentenceTransformer

# Load the model once globally
MODEL = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(text):
    """
    Generates an embedding for the given text using all-MiniLM-L6-v2.
    Returns a list of floats.
    """
    if not text:
        return []
    embedding = MODEL.encode(text)
    return embedding.tolist()

def cosine_similarity(vec_a, vec_b):
    """
    Computes cosine similarity between two vectors:
    similarity = dot(A, B) / (||A|| * ||B||)
    """
    a = np.array(vec_a)
    b = np.array(vec_b)
    
    if np.all(a == 0) or np.all(b == 0):
        return 0.0
        
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    return float(dot_product / (norm_a * norm_b))
