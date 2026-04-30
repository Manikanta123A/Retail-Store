from database import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.String(36), primary_key=True)
    bill_id = db.Column(db.String(36), db.ForeignKey('bills.id', ondelete='CASCADE'))
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'))
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    balance_before = db.Column(db.Numeric(12, 2))
    balance_after = db.Column(db.Numeric(12, 2))
    payment_mode = db.Column(db.String(50), default='Cash')
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "bill_id": self.bill_id,
            "customer_id": self.customer_id,
            "amount": float(self.amount),
            "balance_before": float(self.balance_before) if self.balance_before else 0,
            "balance_after": float(self.balance_after) if self.balance_after else 0,
            "payment_mode": self.payment_mode,
            "created_at": self.created_at.isoformat()
        }
