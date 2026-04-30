from flask import Blueprint, jsonify, request
from database import db
from models.bill import Bill
from models.customer import Customer
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/', methods=['GET'])
def get_dashboard_data():
    user_id = request.headers.get('X-User-Id')
    time_range = request.args.get('range', 'today') # today, week, month, year
    
    now = datetime.utcnow()
    if time_range == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == 'week':
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == 'month':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif time_range == 'last_week':
        start_date = now - timedelta(days=now.weekday() + 7)
        end_date = start_date + timedelta(days=7)
    else:
        start_date = now - timedelta(days=365) # default to year
        
    # Query logic
    query_filter = (Bill.created_at >= start_date) & (Bill.user_id == user_id)
    if time_range == 'last_week':
        query_filter = (Bill.created_at >= start_date) & (Bill.created_at < end_date) & (Bill.user_id == user_id)

    # basic stats
    bills = Bill.query.filter(query_filter).all()
    total_sales = sum(float(b.final_amount) for b in bills)
    bills_count = len(bills)
    dues_added = sum(float(b.due_amount) for b in bills)
    
    # dues collected - we'll approximate for now
    dues_collected = sum(float(b.paid_amount) for b in bills if b.status == 'paid_due')
    
    # recent transactions
    recent_bills_query = Bill.query.filter_by(user_id=user_id).order_by(Bill.created_at.desc()).limit(10).all()
    recent_bills = []
    for b in recent_bills_query:
        customer = Customer.query.get(b.customer_id)
        recent_bills.append({
            "id": f"#{b.bill_number}",
            "customer": customer.name if customer else "Unknown",
            "phone": customer.phone if customer else "",
            "amount": float(b.final_amount),
            "status": b.status
        })

    # chart data (last 7 days if week or today)
    chart_data = []
    for i in range(7):
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6-i)
        day_end = day_start + timedelta(days=1)
        day_bills = Bill.query.filter(Bill.created_at >= day_start, Bill.created_at < day_end, Bill.user_id == user_id).all()
        chart_data.append({
            "name": day_start.strftime('%a'),
            "sales": sum(float(b.final_amount) for b in day_bills),
            "dues": sum(float(b.due_amount) for b in day_bills)
        })

    # high dues
    top_dues_query = Customer.query.filter(Customer.outstanding_due > 0, Customer.user_id == user_id).order_by(Customer.outstanding_due.desc()).limit(5).all()
    top_dues = []
    for c in top_dues_query:
        top_dues.append({
            "name": c.name,
            "lastSeen": c.last_purchase_date.strftime('%Y-%m-%d') if c.last_purchase_date else "N/A",
            "amount": float(c.outstanding_due)
        })

    return jsonify({
        "stats": {
            "sales": float(total_sales),
            "bills": bills_count,
            "dues_added": float(dues_added),
            "dues_collected": float(dues_collected)
        },
        "recent_bills": recent_bills,
        "chart_data": chart_data,
        "top_dues": top_dues
    })
