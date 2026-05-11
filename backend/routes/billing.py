from flask import Blueprint, request, jsonify
from database import db
from models.bill import Bill, BillItem
from models.payment import Payment
from models.item import Item
from models.customer import Customer
import uuid
from utils.email_utils import send_bill_email, send_payment_email

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/', methods=['GET'])
def get_bills():
    user_id = request.headers.get('X-User-Id')
    customer_id = request.args.get('customer_id')
    search = request.args.get('search')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = db.session.query(Bill, Customer.name).join(Customer, Bill.customer_id == Customer.id).filter(Bill.user_id == user_id)
    
    if customer_id:
        query = query.filter(Bill.customer_id == customer_id)
    
    if search:
        query = query.filter(Customer.name.ilike(f'%{search}%'))

    if start_date:
        from datetime import datetime
        try:
            sd = datetime.fromisoformat(start_date.replace('Z', ''))
            query = query.filter(Bill.created_at >= sd)
        except: pass
    
    if end_date:
        from datetime import datetime
        try:
            ed = datetime.fromisoformat(end_date.replace('Z', ''))
            query = query.filter(Bill.created_at <= ed)
        except: pass
        
    results = query.order_by(Bill.created_at.desc()).all()
    
    bills_data = []
    for bill, cust_name in results:
        b_dict = bill.to_dict()
        b_dict['customer_name'] = cust_name
        bills_data.append(b_dict)
        
    return jsonify(bills_data)

@billing_bp.route('/summary', methods=['GET'])
def get_billing_summary():
    user_id = request.headers.get('X-User-Id')
    start_date = request.args.get('start_date')
    
    from datetime import datetime
    try:
        sd = datetime.fromisoformat(start_date.replace('Z', ''))
    except:
        sd = datetime.utcnow() - timedelta(days=30)

    # All calculations on backend to save bandwidth and CPU
    bills_query = Bill.query.filter(Bill.user_id == user_id, Bill.created_at >= sd)
    bills = bills_query.all()
    
    total_sales = sum(float(b.final_amount) for b in bills)
    total_bills = len(bills)
    due_added = sum(float(b.due_amount) for b in bills)
    
    from models.payment import Payment
    payments = Payment.query.filter(Payment.user_id == user_id, Payment.created_at >= sd).all()
    due_collected = sum(float(p.amount) for p in payments if p.balance_before and float(p.balance_before) > 0)
    
    total_pending = db.session.query(db.func.sum(Customer.outstanding_due)).filter(Customer.user_id == user_id).scalar() or 0

    return jsonify({
        "totalSales": total_sales,
        "totalBills": total_bills,
        "dueAdded": due_added,
        "dueCollected": due_collected,
        "pendingDue": float(total_pending)
    })

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
        
    if paid_amount > 0:
        payment = Payment(
            id=str(uuid.uuid4()),
            bill_id=bill_id,
            customer_id=customer.id,
            amount=paid_amount,
            balance_before=final_amount,
            balance_after=due_amount,
            payment_mode=data.get('payment_mode', 'Cash'),
            user_id=user_id
        )
        db.session.add(payment)
    
    db.session.commit()
    
    # Send Email Invoice
    try:
        send_bill_email(bill_id)
    except Exception as e:
        print(f"Error triggering bill email: {str(e)}")
    
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
    bill_dict['payments'] = [p.to_dict() for p in bill.payments]
    
    customer = Customer.query.get(bill.customer_id)
    bill_dict['customer_name'] = customer.name if customer else "Deleted Customer"
    
    return jsonify(bill_dict)

@billing_bp.route('/payments', methods=['GET'])
def get_payments():
    user_id = request.headers.get('X-User-Id')
    query = Payment.query.filter_by(user_id=user_id)
    
    customer_id = request.args.get('customer_id')
    if customer_id:
        query = query.filter_by(customer_id=customer_id)
        
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    from datetime import datetime, timedelta
    
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date.replace('Z', ''))
            query = query.filter(Payment.created_at >= sd)
        except: pass
        
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date.replace('Z', ''))
            query = query.filter(Payment.created_at <= ed)
        except: pass

    search = request.args.get('search')
    if search:
        # Join with customer to search by name
        query = query.join(Customer, Payment.customer_id == Customer.id).filter(Customer.name.ilike(f'%{search}%'))
        
    payments = query.order_by(Payment.created_at.desc()).all()
    
    results = []
    for p in payments:
        bill = Bill.query.get(p.bill_id)
        customer = Customer.query.get(p.customer_id)
        res = p.to_dict()
        res['bill_number'] = bill.bill_number if bill else "N/A"
        res['customer_name'] = customer.name if customer else "N/A"
        results.append(res)
        
    return jsonify(results)

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
    old_due = bill.due_amount
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
        
    # Record payment
    payment = Payment(
        id=str(uuid.uuid4()),
        bill_id=id,
        customer_id=bill.customer_id,
        amount=amount,
        balance_before=float(old_due),
        balance_after=float(bill.due_amount),
        user_id=user_id,
        payment_mode=data.get('payment_mode', 'Cash')
    )
    db.session.add(payment)
        
    db.session.commit()
    
    # Send Receipt Email
    try:
        send_payment_email(payment.id)
    except Exception as e:
        print(f"Error triggering payment email: {str(e)}")
        
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
        
        # Recalculate last purchase date
        latest_bill = Bill.query.filter(
            Bill.customer_id == customer.id,
            Bill.id != id
        ).order_by(Bill.created_at.desc()).first()
        customer.last_purchase_date = latest_bill.created_at if latest_bill else None
        
    db.session.delete(bill)
    db.session.commit()
    
    return '', 204
