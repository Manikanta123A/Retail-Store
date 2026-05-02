import os
import sys
from dotenv import load_dotenv
import time

# Add backend to path
sys.path.append('e:/RetailStore/backend')

from app import create_app
from database import db
from models.customer import Customer
from models.bill import Bill
from utils.email_utils import send_bill_email

def test_backend_email():
    app = create_app()
    with app.app_context():
        # Target Dev specifically
        customer = Customer.query.filter(Customer.name == "Dev").first()
        if not customer:
            print("Customer 'Dev' not found")
            return
        
        print(f"Found customer: {customer.name} ({customer.email})")
        
        bill = Bill.query.filter_by(customer_id=customer.id).first()
        if not bill:
            print(f"No bills found for customer {customer.name}")
            return
            
        print(f"Attempting to send email for bill #{bill.bill_number}")
        try:
            send_bill_email(bill.id)
            print("Email function called. Waiting 5 seconds for thread to finish...")
            time.sleep(5)
            print("Done.")
        except Exception as e:
            print(f"Error calling send_bill_email: {str(e)}")

if __name__ == "__main__":
    test_backend_email()
