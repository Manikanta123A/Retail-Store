from flask import Blueprint, request, jsonify
from database import db
from models.customer import Customer
import uuid

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
def get_customers():
    user_id = request.headers.get('X-User-Id')
    search_query = request.args.get('search', '')
    query = Customer.query.filter_by(user_id=user_id)
    if search_query:
        query = query.filter(
            (Customer.name.ilike(f'%{search_query}%')) | 
            (Customer.phone.ilike(f'%{search_query}%'))
        )
    customers = query.all()
    return jsonify([c.to_dict() for c in customers])

@customers_bp.route('/', methods=['POST'])
def add_customer():
    data = request.get_json()
    
    if not data.get('name') or not data.get('phone'):
        return jsonify({"error": "Name and Phone are required"}), 400
        
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    # Check if customer already exists for this user
    existing = Customer.query.filter_by(phone=data['phone'], user_id=user_id).first()
    if existing:
        return jsonify({"error": "Customer with this phone already exists"}), 409
        
    new_customer = Customer(
        id=str(uuid.uuid4()),
        name=data['name'],
        phone=data['phone'],
        email=data.get('email'),
        user_id=user_id
    )
    
    db.session.add(new_customer)
    db.session.commit()
    
    return jsonify(new_customer.to_dict()), 201

@customers_bp.route('/<id>', methods=['GET'])
def get_customer(id):
    user_id = request.headers.get('X-User-Id')
    customer = Customer.query.filter_by(id=id, user_id=user_id).first_or_404()
    return jsonify(customer.to_dict())

@customers_bp.route('/<id>', methods=['PUT'])
def update_customer(id):
    user_id = request.headers.get('X-User-Id')
    customer = Customer.query.filter_by(id=id, user_id=user_id).first_or_404()
    data = request.get_json()
    if 'name' in data: customer.name = data['name']
    if 'phone' in data: customer.phone = data['phone']
    if 'email' in data: customer.email = data['email']
    db.session.commit()
    return jsonify(customer.to_dict())

@customers_bp.route('/<id>', methods=['DELETE'])
def delete_customer(id):
    user_id = request.headers.get('X-User-Id')
    customer = Customer.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(customer)
    db.session.commit()
    return '', 204
