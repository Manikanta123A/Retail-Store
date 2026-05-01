from flask import Blueprint, jsonify, request
from database import db
from models.bill import Bill, BillItem
from models.payment import Payment
from models.item import Item
from models.customer import Customer
from datetime import datetime, timedelta
import traceback
from sqlalchemy import func, desc
from utils.email_utils import send_monthly_stats

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/send-report', methods=['POST'])
def trigger_monthly_report():
    user_id = request.headers.get('X-User-Id')
    target_email = "ashwinkimar694@gmail.com"
    try:
        send_monthly_stats(user_id, target_email)
        return jsonify({"message": f"Monthly report sent to {target_email}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analytics_bp.route('/', methods=['GET'])
def get_analytics():
    try:
        user_id = request.headers.get('X-User-Id')
        if not user_id:
            return jsonify({"error": "User ID missing"}), 400

        time_filter = request.args.get('filter', 'monthly') # weekly, monthly, custom
        
        now = datetime.utcnow()
        end_date = now
        
        if time_filter == 'weekly':
            start_date = now - timedelta(days=7)
        elif time_filter == 'monthly':
            start_date = now - timedelta(days=30)
        elif time_filter == 'custom':
            start_str = request.args.get('start_date')
            end_str = request.args.get('end_date')
            try:
                start_date = datetime.fromisoformat(start_str.replace('Z', ''))
                if end_str:
                    end_date = datetime.fromisoformat(end_str.replace('Z', ''))
            except:
                start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=30)

        # Ensure naive comparison
        start_date = start_date.replace(tzinfo=None)
        end_date = end_date.replace(tzinfo=None)

        # 1. Key Metrics
        bills = Bill.query.filter(
            Bill.created_at >= start_date, 
            Bill.created_at <= end_date, 
            Bill.user_id == user_id
        ).all()
        
        total_revenue = sum(float(b.final_amount or 0) for b in bills)
        avg_bill_value = total_revenue / len(bills) if bills else 0
        
        total_pending_due = db.session.query(func.sum(Customer.outstanding_due)).filter(Customer.user_id == user_id).scalar() or 0
        
        payments = Payment.query.filter(
            Payment.created_at >= start_date, 
            Payment.created_at <= end_date, 
            Payment.user_id == user_id
        ).all()
        
        due_collected = sum(float(p.amount or 0) for p in payments if p.balance_before and float(p.balance_before) > 0)

        # 2. Trends
        delta = end_date - start_date
        days = delta.days + 1
        revenue_trend = []
        due_trend = []
        
        # Limit trend points to avoid performance issues for long custom ranges
        step = 1
        if days > 60: step = days // 30 # Show monthly-ish points if range is huge

        for i in range(0, days, step):
            d = start_date + timedelta(days=i)
            d_start = d.replace(hour=0, minute=0, second=0, microsecond=0)
            d_end = d_start + timedelta(days=step)
            
            # Revenue
            day_bills = [b for b in bills if d_start <= b.created_at.replace(tzinfo=None) < d_end]
            day_rev = sum(float(b.final_amount or 0) for b in day_bills)
            revenue_trend.append({
                "date": d_start.strftime('%d %b'),
                "revenue": day_rev
            })
            
            # Due Trend
            day_due_added = sum(float(b.due_amount or 0) for b in day_bills)
            day_payments = [p for p in payments if d_start <= p.created_at.replace(tzinfo=None) < d_end]
            day_due_collected = sum(float(p.amount or 0) for p in day_payments if p.balance_before and float(p.balance_before) > 0)
            
            due_trend.append({
                "date": d_start.strftime('%d %b'),
                "added": day_due_added,
                "collected": day_due_collected
            })

        # 3. Top Selling Items
        top_items_query = db.session.query(
            Item.name, 
            func.sum(BillItem.quantity).label('total_qty')
        ).join(BillItem, Item.id == BillItem.item_id)\
         .join(Bill, Bill.id == BillItem.bill_id)\
         .filter(Bill.created_at >= start_date, Bill.created_at <= end_date, Bill.user_id == user_id)\
         .group_by(Item.id)\
         .order_by(desc('total_qty'))\
         .limit(5).all()
         
        top_selling = [{"name": name, "quantity": int(qty or 0)} for name, qty in top_items_query]

        # 4. Least Selling Items
        least_items_query = db.session.query(
            Item.name, 
            func.sum(BillItem.quantity).label('total_qty')
        ).join(BillItem, Item.id == BillItem.item_id)\
         .join(Bill, Bill.id == BillItem.bill_id)\
         .filter(Bill.created_at >= start_date, Bill.created_at <= end_date, Bill.user_id == user_id)\
         .group_by(Item.id)\
         .order_by('total_qty')\
         .limit(5).all()
         
        least_selling = [{"name": name, "quantity": int(qty or 0)} for name, qty in least_items_query]

        # 5. Insights
        insights = []
        if top_selling:
            insights.append(f"{top_selling[0]['name']} is your best-selling product.")
        
        total_due_added = sum(float(b.due_amount or 0) for b in bills)
        if total_due_added > due_collected:
            insights.append(f"Dues increased by ₹{total_due_added - due_collected:.2f} this period.")
        elif due_collected > 0:
            insights.append(f"Debt recovery is strong: ₹{due_collected - total_due_added:.2f} more collected than added.")
            
        high_due_customers = Customer.query.filter(Customer.user_id == user_id, Customer.outstanding_due > 0).order_by(Customer.outstanding_due.desc()).limit(3).all()
        if high_due_customers:
            names = ", ".join([c.name for c in high_due_customers])
            insights.append(f"Top dues held by: {names}.")
            
        high_due_customers_data = [{"id": c.id, "name": c.name} for c in high_due_customers]

        # Identify items with zero sales
        try:
            sold_item_names = {name for name, qty in db.session.query(Item.name, func.sum(BillItem.quantity))\
                .join(BillItem).join(Bill)\
                .filter(Bill.created_at >= start_date, Bill.user_id == user_id)\
                .group_by(Item.id).all()}
            
            all_items = Item.query.filter_by(user_id=user_id).all()
            unsold_items = [i.name for i in all_items if i.name not in sold_item_names][:3]
            if unsold_items:
                insights.append(f"Items with no sales recently: {', '.join(unsold_items)}.")
        except:
            pass

        return jsonify({
            "metrics": {
                "total_revenue": float(total_revenue),
                "due_collected": float(due_collected),
                "pending_due": float(total_pending_due),
                "avg_bill_value": float(avg_bill_value)
            },
            "trends": {
                "revenue": revenue_trend,
                "due": due_trend
            },
            "top_items": top_selling,
            "least_items": least_selling,
            "insights": insights,
            "high_due_customers": high_due_customers_data
        })
    except Exception as e:
        print(f"Analytics Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500
