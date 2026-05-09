import os
import time
import google.generativeai as genai
from app import create_app
from database import db
from models.item import Item
from utils.embedding_utils import generate_embedding
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

def get_smart_description(name, category):
    prompt = f"""
    Generate a concise product description (20-30 words) for a retail store item.
    Item Name: {name}
    Category: {category}
    
    The description MUST include:
    1. Appearance (likely color, type)
    2. Characteristics (material, usage, style)
    
    Format: Return ONLY the description text. No intro/outro.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error generating description for {name}: {e}")
        return f"A high-quality {name} in the {category} category."

def smart_migrate():
    app = create_app()
    with app.app_context():
        print("Starting smart migration using Gemini AI...")
        items = Item.query.all()
        
        for item in items:
            print(f"Analyzing: {item.name} ({item.category})...")
            
            # Generate smart description
            smart_desc = get_smart_description(item.name, item.category)
            item.description = smart_desc
            
            # Generate new embedding
            embedding_text = f"{item.name} {smart_desc}"
            item.description_embedding = generate_embedding(embedding_text)
            
            print(f"  - New Description: {smart_desc[:50]}...")
            
            # Simple rate limiting for Gemini free tier if many items
            time.sleep(1) 
            
        db.session.commit()
        print("\nSuccessfully fixed the mess! All items now have smart descriptions and embeddings.")

if __name__ == "__main__":
    smart_migrate()
