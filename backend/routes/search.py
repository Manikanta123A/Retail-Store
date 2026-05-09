from flask import Blueprint, request, jsonify
from database import db
from models.customer import Customer
from models.item import Item
from models.bill import Bill

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['GET'])
def global_search():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    query_str = request.args.get('q', '').strip()
    if not query_str:
        return jsonify({"customers": [], "items": [], "bills": []})

    # Search Customers
    customers = Customer.query.filter(
        Customer.user_id == user_id,
        (Customer.name.ilike(f'%{query_str}%')) | (Customer.phone.ilike(f'%{query_str}%'))
    ).limit(5).all()

    # Search Items
    items = Item.query.filter(
        Item.user_id == user_id,
        (Item.name.ilike(f'%{query_str}%')) | (Item.category.ilike(f'%{query_str}%'))
    ).limit(5).all()

    # Search Bills (by bill number or customer name)
    # Note: Bill doesn't have bill_number in the schema I saw, but it has id.
    # Let's check Bill model.
    bills = Bill.query.join(Customer).filter(
        Bill.user_id == user_id,
        (Customer.name.ilike(f'%{query_str}%')) | (Bill.id.ilike(f'%{query_str}%'))
    ).limit(5).all()

    return jsonify({
        "customers": [c.to_dict() for c in customers],
        "items": [i.to_dict() for i in items],
        "bills": [{
            "id": b.id,
            "bill_number": b.bill_number,
            "customer_name": b.customer.name,
            "total_amount": float(b.total_amount),
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "status": b.status
        } for b in bills]
    })
