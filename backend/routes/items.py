from flask import Blueprint, request, jsonify
from database import db
from models.item import Item
import uuid
from utils.embedding_utils import generate_embedding, cosine_similarity

items_bp = Blueprint('items', __name__)

@items_bp.route('/', methods=['GET'])
def get_items():
    user_id = request.headers.get('X-User-Id')
    search_query = request.args.get('search', '').strip()
    
    # Base query for the user's items
    query = Item.query.filter_by(user_id=user_id, is_active=True)
    
    if not search_query:
        items = query.all()
        return jsonify([i.to_dict() for i in items])

    # STEP 1: Exact match on product name (case-insensitive)
    exact_matches = Item.query.filter(
        Item.user_id == user_id,
        Item.is_active == True,
        Item.name.ilike(search_query)
    ).all()
    
    if exact_matches:
        return jsonify([i.to_dict() for i in exact_matches])

    # STEP 2 (Fallback): Semantic Search
    all_items = query.all()
    if not all_items:
        return jsonify([])

    # Generate embedding for search query
    query_vec = generate_embedding(search_query)
    
    # Calculate similarities
    scored_items = []
    for item in all_items:
        if item.description_embedding:
            score = cosine_similarity(query_vec, item.description_embedding)
            scored_items.append((item, score))
    
    # Rank results by similarity score
    scored_items.sort(key=lambda x: x[1], reverse=True)
    
    # Filter by a threshold (optional but good) and return top matches
    # The requirement didn't specify a threshold, so let's just return top results with score > 0.1
    results = [item.to_dict() for item, score in scored_items if score > 0.1]
    
    return jsonify(results[:10]) # Return top 10

@items_bp.route('/', methods=['POST'])
def add_item():
    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    description = data.get('description')
    
    if not name or not price or not description:
        return jsonify({"error": "Name, Price, and Description are required"}), 400
        
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    # Generate embedding (Name + Description)
    # ONLY at creation time
    embedding_text = f"{name} {description}"
    embedding = generate_embedding(embedding_text)
        
    new_item = Item(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        category=data.get('category'),
        price=price,
        stock_quantity=data.get('stock_quantity', 0),
        description_embedding=embedding,
        user_id=user_id
    )
    
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@items_bp.route('/<id>', methods=['PUT'])
def update_item(id):
    user_id = request.headers.get('X-User-Id')
    item = Item.query.filter_by(id=id, user_id=user_id).first_or_404()
    data = request.get_json()
    
    if 'name' in data: item.name = data['name']
    if 'description' in data: item.description = data['description']
    if 'category' in data: item.category = data['category']
    if 'price' in data: item.price = data['price']
    if 'stock_quantity' in data: item.stock_quantity = data['stock_quantity']
    
    # Requirement: "Embeddings should be stored, not recomputed"
    # "Do this ONLY at creation time"
    # So we don't update the embedding here even if name/description changes.
    
    db.session.commit()
    return jsonify(item.to_dict())

@items_bp.route('/<id>', methods=['DELETE'])
def delete_item(id):
    user_id = request.headers.get('X-User-Id')
    item = Item.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return '', 204
