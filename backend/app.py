from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from database import db

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Register Blueprints
    from routes.customers import customers_bp
    from routes.items import items_bp
    from routes.billing import billing_bp
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp

    app.register_blueprint(customers_bp, url_prefix='/api/customers')
    app.register_blueprint(items_bp, url_prefix='/api/items')
    app.register_blueprint(billing_bp, url_prefix='/api/billing')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    @app.route('/api/ping', methods=['GET'])
    def ping():
        return jsonify({"message": "pong"})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
