from database import db
from datetime import datetime

class Bill(db.Model):
    __tablename__ = 'bills'
    id = db.Column(db.String(36), primary_key=True)
    bill_number = db.Column(db.Integer, unique=True, server_default=db.FetchedValue())
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'))
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    discount_amount = db.Column(db.Numeric(12, 2), default=0.00)
    tax_amount = db.Column(db.Numeric(12, 2), default=0.00)
    final_amount = db.Column(db.Numeric(12, 2), nullable=False)
    paid_amount = db.Column(db.Numeric(12, 2), default=0.00)
    due_amount = db.Column(db.Numeric(12, 2), default=0.00)
    status = db.Column(db.String(20), default='unpaid')
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "bill_number": self.bill_number,
            "customer_id": self.customer_id,
            "total_amount": float(self.total_amount),
            "discount_amount": float(self.discount_amount),
            "final_amount": float(self.final_amount),
            "paid_amount": float(self.paid_amount),
            "due_amount": float(self.due_amount),
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }

class BillItem(db.Model):
    __tablename__ = 'bill_items'
    id = db.Column(db.String(36), primary_key=True)
    bill_id = db.Column(db.String(36), db.ForeignKey('bills.id', ondelete='CASCADE'))
    item_id = db.Column(db.String(36), db.ForeignKey('items.id'))
    quantity = db.Column(db.Integer, nullable=False)
    price_at_purchase = db.Column(db.Numeric(12, 2), nullable=False)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
