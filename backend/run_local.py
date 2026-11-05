"""Local runner: creates SQLite tables, then starts Flask on :5000."""
from app import create_app
from database import db
import models.user, models.customer, models.item, models.bill, models.payment  # noqa: F401

app = create_app()
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
