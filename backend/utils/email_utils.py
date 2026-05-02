import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread
from flask import current_app, render_template_string
from models.bill import Bill, BillItem
from models.customer import Customer
from models.payment import Payment
from models.item import Item
from datetime import datetime
from sqlalchemy import func, desc
from database import db
from dotenv import load_dotenv

load_dotenv()

def send_async_email(app, msg, sender_email, sender_password):
    with app.app_context():
        try:
            smtp_server = "smtp.gmail.com"
            smtp_port = 587

            if not sender_email or not sender_password:
                print("EMAIL ERROR: SMTP credentials not provided to thread")
                return

            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
            print(f"EMAIL SUCCESS: Sent to {msg['To']}")
        except Exception as e:
            print(f"EMAIL FAILURE: Could not send to {msg['To']}. Error: {str(e)}")

def send_email(subject, recipient, html_content):
    if not recipient:
        print("EMAIL SKIP: No recipient email provided")
        return
    
    sender_email = os.getenv('SMTP_EMAIL')
    sender_password = os.getenv('SMTP_PASSWORD')

    if not sender_email or not sender_password:
        print("EMAIL ERROR: SMTP_EMAIL or SMTP_PASSWORD not set in environment")
        return

    app = current_app._get_current_object()
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = f"Retail Pro <{sender_email}>"
    msg['To'] = recipient
    msg.attach(MIMEText(html_content, 'html'))
    
    Thread(target=send_async_email, args=(app, msg, sender_email, sender_password)).start()

# --- Templates ---

INVOICE_TEMPLATE = """
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563EB; text-align: center;">RETAIL PRO - INVOICE</h2>
        <p>Dear {{ customer_name }},</p>
        <p>Thank you for your purchase. Here are your bill details:</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Bill ID:</strong> #{{ bill_number }}</p>
            <p><strong>Date:</strong> {{ date }}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid #eee;">
                    <th style="text-align: left; padding: 10px;">Item</th>
                    <th style="text-align: center; padding: 10px;">Qty</th>
                    <th style="text-align: right; padding: 10px;">Price</th>
                    <th style="text-align: right; padding: 10px;">Total</th>
                </tr>
            </thead>
            <tbody>
                {% for item in items %}
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">{{ item.name }}</td>
                    <td style="padding: 10px; text-align: center;">{{ item.quantity }}</td>
                    <td style="padding: 10px; text-align: right;">₹{{ item.price }}</td>
                    <td style="padding: 10px; text-align: right;">₹{{ item.total }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
            <p><strong>Subtotal:</strong> ₹{{ total_amount }}</p>
            {% if discount > 0 %}<p><strong>Discount:</strong> -₹{{ discount }}</p>{% endif %}
            <h3 style="color: #2563EB;">Final Amount: ₹{{ final_amount }}</h3>
            <p style="color: #059669;"><strong>Paid:</strong> ₹{{ paid_amount }}</p>
            {% if due_amount > 0 %}<p style="color: #DC2626;"><strong>Outstanding Due:</strong> ₹{{ due_amount }}</p>{% endif %}
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="text-size: 12px; color: #777; text-align: center;">Thank you for shopping with us!</p>
    </div>
</body>
</html>
"""

RECEIPT_TEMPLATE = """
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #059669; text-align: center;">PAYMENT RECEIPT</h2>
        <p>Dear {{ customer_name }},</p>
        <p>We have successfully received your payment.</p>
        
        <div style="background: #ECFDF5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <p><strong>Amount Collected:</strong> ₹{{ amount }}</p>
            <p><strong>Payment Mode:</strong> {{ mode }}</p>
            <p><strong>Date:</strong> {{ date }}</p>
        </div>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p><strong>Previous Balance:</strong> ₹{{ balance_before }}</p>
            <p><strong>Remaining Balance:</strong> ₹{{ balance_after }}</p>
        </div>

        <p style="margin-top: 30px; text-align: center; color: #777;">RETAIL PRO - Digital Receipt</p>
    </div>
</body>
</html>
"""

MONTHLY_REPORT_TEMPLATE = """
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #1E40AF; text-align: center;">MONTHLY BUSINESS REPORT</h2>
        <p>Monthly summary for {{ month_year }}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
            <div style="background: #EFF6FF; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; color: #3B82F6;">TOTAL SALES</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">₹{{ total_sales }}</p>
            </div>
            <div style="background: #ECFDF5; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; color: #10B981;">TOTAL COLLECTED</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">₹{{ total_collected }}</p>
            </div>
            <div style="background: #FFFBEB; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; color: #F59E0B;">NEW DUES</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">₹{{ new_dues }}</p>
            </div>
            <div style="background: #F8FAFC; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; color: #64748B;">BILLS GENERATED</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">{{ total_bills }}</p>
            </div>
        </div>

        <h3>Top Selling Items</h3>
        <ul style="list-style: none; padding: 0;">
            {% for item in top_items %}
            <li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>{{ item.name }}</span>
                <span style="font-weight: bold;">{{ item.quantity }} units</span>
            </li>
            {% endfor %}
        </ul>

        <p style="margin-top: 30px; text-align: center; color: #777;">Generated by Retail Pro System</p>
    </div>
</body>
</html>
"""

# --- Functions ---

def send_bill_email(bill_id):
    bill = db.session.get(Bill, bill_id)
    if not bill: 
        print(f"EMAIL ERROR: Bill {bill_id} not found")
        return
    customer = db.session.get(Customer, bill.customer_id)
    if not customer or not customer.email:
        print(f"EMAIL SKIP: Customer {customer.name if customer else 'Unknown'} has no email")
        return

    items = []
    for bi in bill.items:
        item = Item.query.get(bi.item_id)
        items.append({
            "name": item.name if item else "Item",
            "quantity": bi.quantity,
            "price": float(bi.price_at_purchase),
            "total": float(bi.total_price)
        })

    html = render_template_string(
        INVOICE_TEMPLATE,
        customer_name=customer.name,
        bill_number=bill.bill_number,
        date=bill.created_at.strftime('%d %b %Y'),
        items=items,
        total_amount=float(bill.total_amount),
        discount=float(bill.discount_amount),
        final_amount=float(bill.final_amount),
        paid_amount=float(bill.paid_amount),
        due_amount=float(bill.due_amount)
    )
    
    send_email(f"Invoice for Bill #{bill.bill_number}", customer.email, html)

def send_payment_email(payment_id):
    payment = db.session.get(Payment, payment_id)
    if not payment:
        print(f"EMAIL ERROR: Payment {payment_id} not found")
        return
    customer = db.session.get(Customer, payment.customer_id)
    if not customer or not customer.email:
        print(f"EMAIL SKIP: Customer {customer.name if customer else 'Unknown'} has no email")
        return

    html = render_template_string(
        RECEIPT_TEMPLATE,
        customer_name=customer.name,
        amount=float(payment.amount),
        mode=payment.payment_mode,
        date=payment.created_at.strftime('%d %b %Y %I:%M %p'),
        balance_before=float(payment.balance_before or 0),
        balance_after=float(payment.balance_after or 0)
    )
    
    send_email("Payment Receipt - Retail Pro", customer.email, html)

def send_monthly_stats(user_id, target_email):
    # Monthly Aggregation
    now = datetime.utcnow()
    start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    bills = Bill.query.filter(Bill.created_at >= start_date, Bill.user_id == user_id).all()
    payments = Payment.query.filter(Payment.created_at >= start_date, Payment.user_id == user_id).all()
    
    total_sales = sum(float(b.final_amount) for b in bills)
    total_collected = sum(float(p.amount) for p in payments)
    new_dues = sum(float(b.due_amount) for b in bills)
    
    # Top Items logic
    top_items_query = db.session.query(
        Item.name, 
        func.sum(BillItem.quantity).label('total_qty')
    ).join(BillItem, Item.id == BillItem.item_id)\
     .join(Bill, Bill.id == BillItem.bill_id)\
     .filter(Bill.created_at >= start_date, Bill.user_id == user_id)\
     .group_by(Item.id)\
     .order_by(desc('total_qty'))\
     .limit(5).all()
     
    top_items = [{"name": name, "quantity": int(qty or 0)} for name, qty in top_items_query]

    html = render_template_string(
        MONTHLY_REPORT_TEMPLATE,
        month_year=now.strftime('%B %Y'),
        total_sales=total_sales,
        total_collected=total_collected,
        new_dues=new_dues,
        total_bills=len(bills),
        top_items=top_items
    )
    
    send_email(f"Monthly Business Report - {now.strftime('%B %Y')}", target_email, html)
