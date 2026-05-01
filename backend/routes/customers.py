from flask import Blueprint, request, jsonify
from database import db
from models.customer import Customer
import uuid
from utils.email_utils import send_payment_email

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

@customers_bp.route('/<id>/collect', methods=['PUT'])
def collect_dues(id):
    user_id = request.headers.get('X-User-Id')
    customer = Customer.query.filter_by(id=id, user_id=user_id).first_or_404()
    
    data = request.get_json()
    amount_to_collect = float(data.get('amount', 0))
    payment_ids = []
    
    if amount_to_collect <= 0:
        return jsonify({"error": "Invalid amount"}), 400
        
    from decimal import Decimal
    from models.bill import Bill
    
    # Get all unpaid/partial bills for this customer, oldest first
    bills = Bill.query.filter(
        Bill.customer_id == id,
        Bill.user_id == user_id,
        Bill.due_amount > 0
    ).order_by(Bill.created_at.asc()).all()
    
    remaining_collection = Decimal(str(amount_to_collect))
    
    for bill in bills:
        if remaining_collection <= 0:
            break
            
        old_due = bill.due_amount
        due = bill.due_amount
        if remaining_collection >= due:
            # Pay off this bill completely
            bill.paid_amount += due
            bill.due_amount = 0
            bill.status = 'paid'
            remaining_collection -= due
            payment_amount = due
        else:
            # Pay partially
            bill.paid_amount += remaining_collection
            bill.due_amount -= remaining_collection
            bill.status = 'partial'
            payment_amount = remaining_collection
            remaining_collection = Decimal('0')
            
        # Record payment for this bill
        from models.payment import Payment
        payment = Payment(
            id=str(uuid.uuid4()),
            bill_id=bill.id,
            customer_id=id,
            amount=float(payment_amount),
            balance_before=float(old_due),
            balance_after=float(bill.due_amount),
            user_id=user_id,
            payment_mode=data.get('payment_mode', 'Collection')
        )
        db.session.add(payment)
        payment_ids.append(payment.id)
            
    # Amount actually applied
    applied_amount = Decimal(str(amount_to_collect)) - remaining_collection
    customer.outstanding_due -= applied_amount
    if customer.outstanding_due < 0:
        customer.outstanding_due = 0
        
    db.session.commit()
    
    # Send Receipt Emails
    for pid in payment_ids:
        try:
            send_payment_email(pid)
        except:
            pass
            
    return jsonify({"success": True, "applied": float(applied_amount), "customer": customer.to_dict()})
