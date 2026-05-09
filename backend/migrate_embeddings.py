from app import create_app
from database import db
from models.item import Item
from utils.embedding_utils import generate_embedding

def migrate_existing_items():
    app = create_app()
    with app.app_context():
        print("Scanning for items without embeddings...")
        items = Item.query.filter(Item.description_embedding == None).all()
        
        if not items:
            print("All items already have embeddings.")
            return

        print(f"Generating embeddings for {len(items)} items...")
        
        for item in items:
            # Fallback for description if it's missing for old items
            desc = item.description if item.description else ""
            embedding_text = f"{item.name} {desc}"
            
            print(f"  - Processing: {item.name}")
            item.description_embedding = generate_embedding(embedding_text)
            
            # If description was missing, maybe set a placeholder
            if not item.description:
                item.description = "Legacy item - no description provided."
        
        db.session.commit()
        print(f"Successfully migrated {len(items)} items.")

if __name__ == "__main__":
    migrate_existing_items()
