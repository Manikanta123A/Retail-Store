from flask import Blueprint, request, jsonify
from database import db
from models.bill import Bill, BillItem
from models.item import Item
from models.customer import Customer
import uuid

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/', methods=['GET'])
def get_bills():
    user_id = request.headers.get('X-User-Id')
    customer_id = request.args.get('customer_id')
    search = request.args.get('search')
    
    query = Bill.query.filter_by(user_id=user_id)
    if customer_id:
        query = query.filter(Bill.customer_id == customer_id)
        
    bills = query.order_by(Bill.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bills])

@billing_bp.route('/', methods=['POST'])
def create_bill():
    data = request.get_json()
    
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Validation
    if not data.get('customer_id') or not data.get('items'):
        return jsonify({"error": "Customer and Items are required"}), 400
        
    customer = Customer.query.filter_by(id=data['customer_id'], user_id=user_id).first()
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
        
    bill_id = str(uuid.uuid4())
    total_amount = 0
    bill_items = []
    
    for cart_item in data['items']:
        item = Item.query.filter_by(id=cart_item['item_id'], user_id=user_id).first()
        if not item:
            return jsonify({"error": f"Item {cart_item['item_id']} not found"}), 404
            
        item_total = float(item.price) * int(cart_item['quantity'])
        total_amount += item_total
        
        # Create BillItem (Snapshot price)
        b_item = BillItem(
            id=str(uuid.uuid4()),
            bill_id=bill_id,
            item_id=item.id,
            quantity=cart_item['quantity'],
            price_at_purchase=item.price,
            total_price=item_total
        )
        bill_items.append(b_item)
        
        # Update Stock
        item.stock_quantity -= int(cart_item['quantity'])
        
    discount = data.get('discount_amount', 0)
    final_amount = total_amount - discount
    paid_amount = data.get('paid_amount', 0)
    due_amount = final_amount - paid_amount
    
    status = 'paid'
    if due_amount > 0:
        status = 'partial' if paid_amount > 0 else 'due'
        
    new_bill = Bill(
        id=bill_id,
        customer_id=customer.id,
        total_amount=total_amount,
        discount_amount=discount,
        final_amount=final_amount,
        paid_amount=paid_amount,
        due_amount=due_amount,
        status=status,
        user_id=user_id
    )
    
    from decimal import Decimal
    # Update Customer Dues
    customer.outstanding_due += Decimal(str(due_amount))
    customer.total_purchases += Decimal(str(final_amount))
    customer.last_purchase_date = db.func.now()
    
    db.session.add(new_bill)
    for bi in bill_items:
        db.session.add(bi)
    
    db.session.commit()
    
    return jsonify(new_bill.to_dict()), 201

@billing_bp.route('/<id>', methods=['GET'])
def get_bill(id):
    user_id = request.headers.get('X-User-Id')
    bill = Bill.query.filter_by(id=id, user_id=user_id).first_or_404()
    
    bill_dict = bill.to_dict()
    items = []
    for bi in bill.items:
        item = Item.query.get(bi.item_id)
        items.append({
            "name": item.name if item else "Deleted Item",
            "quantity": bi.quantity,
            "price": float(bi.price_at_purchase),
            "total": float(bi.total_price)
        })
    bill_dict['items'] = items
    
    customer = Customer.query.get(bill.customer_id)
    bill_dict['customer_name'] = customer.name if customer else "Deleted Customer"
    
    return jsonify(bill_dict)

@billing_bp.route('/<id>/pay', methods=['PUT'])
def pay_bill(id):
    user_id = request.headers.get('X-User-Id')
    bill = Bill.query.filter_by(id=id, user_id=user_id).first_or_404()
    data = request.get_json()
    amount = float(data.get('amount', 0))
    
    if amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400
        
    if amount > float(bill.due_amount):
        return jsonify({"error": "Amount exceeds due amount"}), 400
        
    from decimal import Decimal
    bill.paid_amount += Decimal(str(amount))
    bill.due_amount -= Decimal(str(amount))
    
    if bill.due_amount == 0:
        bill.status = 'paid'
    else:
        bill.status = 'partial'
        
    # Update customer due
    customer = Customer.query.get(bill.customer_id)
    if customer:
        customer.outstanding_due -= Decimal(str(amount))
        
    db.session.commit()
    return jsonify(bill.to_dict())

@billing_bp.route('/<id>', methods=['DELETE'])
def delete_bill(id):
    user_id = request.headers.get('X-User-Id')
    bill = Bill.query.filter_by(id=id, user_id=user_id).first_or_404()
    
    # Revert item stock
    for bi in bill.items:
        item = Item.query.get(bi.item_id)
        if item:
            item.stock_quantity += bi.quantity
            
    # Revert customer dues
    customer = Customer.query.get(bill.customer_id)
    if customer:
        from decimal import Decimal
        customer.total_purchases -= Decimal(str(bill.final_amount))
        customer.outstanding_due -= Decimal(str(bill.due_amount))
        
    db.session.delete(bill)
    db.session.commit()
    
    return '', 204
