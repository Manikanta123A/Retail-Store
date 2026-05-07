from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os
from database import db
from models.customer import Customer
from models.bill import Bill
from models.item import Item
from models.payment import Payment
from sqlalchemy import func
from datetime import datetime, timedelta
import json

chat_bp = Blueprint('chat', __name__)

# --- AI TOOLS (Functions Gemini can call) ---

def get_customer_details(phone):
    """Fetch customer details and their outstanding due using their phone number."""
    user_id = request.headers.get('X-User-Id')
    customer = Customer.query.filter_by(phone=phone, user_id=user_id).first()
    if not customer:
        return {"error": "Customer not found"}
    return customer.to_dict()

def get_store_summary(period='today'):
    """Get a summary of sales and dues for a given period (today, week, month)."""
    user_id = request.headers.get('X-User-Id')
    now = datetime.utcnow()
    if period == 'week':
        start_date = now - timedelta(days=7)
    elif period == 'month':
        start_date = now - timedelta(days=30)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)

    bills = Bill.query.filter(Bill.created_at >= start_date, Bill.user_id == user_id).all()
    total_sales = sum(float(b.final_amount) for b in bills)
    total_dues = sum(float(b.due_amount) for b in bills)
    
    return {
        "period": period,
        "total_sales": total_sales,
        "total_dues_added": total_dues,
        "bill_count": len(bills)
    }

def get_top_selling_items():
    """Find the most popular items in the store."""
    user_id = request.headers.get('X-User-Id')
    # Simple query for top items by sales frequency or stock (placeholder for complex join)
    items = Item.query.filter_by(user_id=user_id).order_by(Item.stock_quantity.asc()).limit(5).all()
    return [i.to_dict() for i in items]

# --- CHAT ROUTE ---

@chat_bp.route('/', methods=['POST'])
def chat():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    user_message = data.get('message')
    history = data.get('history', [])

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return jsonify({"error": "Gemini API key not configured"}), 500

    genai.configure(api_key=api_key)
    
    # Configure tools
    tools = [get_customer_details, get_store_summary, get_top_selling_items]
    
    model = genai.GenerativeModel(
        model_name='gemini-1.5-flash',
        tools=tools,
        system_instruction=(
            "You are the AI Store Assistant for Anitha Jewellers. "
            "Help the owner manage customers, bills, and dues. "
            "Use the provided tools to get real data. Never guess. "
            "Respond concisely. Use ₹ for currency. "
            "Always be professional and helpful."
        )
    )

    chat = model.start_chat(enable_automatic_function_calling=True)
    
    try:
        response = chat.send_message(user_message)
        return jsonify({
            "response": response.text,
            "history": history + [
                {"role": "user", "parts": [user_message]},
                {"role": "model", "parts": [response.text]}
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
