from database import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(255))
    outstanding_due = db.Column(db.Numeric(12, 2), default=0.00)
    last_purchase_date = db.Column(db.DateTime)
    total_purchases = db.Column(db.Numeric(12, 2), default=0.00)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "outstanding_due": float(self.outstanding_due),
            "last_purchase_date": self.last_purchase_date.isoformat() if self.last_purchase_date else None,
            "total_purchases": float(self.total_purchases),
            "created_at": self.created_at.isoformat()
        }
