from flask import Blueprint, request, jsonify
from database import db
from models.item import Item
import uuid

items_bp = Blueprint('items', __name__)

@items_bp.route('/', methods=['GET'])
def get_items():
    user_id = request.headers.get('X-User-Id')
    search_query = request.args.get('search', '')
    query = Item.query.filter_by(user_id=user_id)
    if search_query:
        query = query.filter(
            (Item.name.ilike(f'%{search_query}%')) | 
            (Item.category.ilike(f'%{search_query}%'))
        )
    items = query.all()
    return jsonify([i.to_dict() for i in items])

@items_bp.route('/', methods=['POST'])
def add_item():
    data = request.get_json()
    if not data.get('name') or not data.get('price'):
        return jsonify({"error": "Name and Price are required"}), 400
        
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    new_item = Item(
        id=str(uuid.uuid4()),
        name=data['name'],
        category=data.get('category'),
        price=data['price'],
        stock_quantity=data.get('stock_quantity', 0),
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
    if 'category' in data: item.category = data['category']
    if 'price' in data: item.price = data['price']
    if 'stock_quantity' in data: item.stock_quantity = data['stock_quantity']
    db.session.commit()
    return jsonify(item.to_dict())

@items_bp.route('/<id>', methods=['DELETE'])
def delete_item(id):
    user_id = request.headers.get('X-User-Id')
    item = Item.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return '', 204
