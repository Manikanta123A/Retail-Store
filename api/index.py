"""
Vercel Serverless Function entry point.
Wraps the Flask app so all /api/* routes are handled by one Python function.
Vercel Python runtime expects a WSGI app or a handler function.
"""
import sys
import os

# Add the backend directory to the Python path so all imports resolve
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, backend_dir)

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env from backend directory (for local dev; Vercel uses env vars from dashboard)
dotenv_path = os.path.join(backend_dir, '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from database import db

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration - Vercel injects env vars automatically
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'retail-pro-secret')

db.init_app(app)

# Register Blueprints
from routes.customers import customers_bp
from routes.items import items_bp
from routes.billing import billing_bp
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.analytics import analytics_bp

app.register_blueprint(customers_bp, url_prefix='/api/customers')
app.register_blueprint(items_bp, url_prefix='/api/items')
app.register_blueprint(billing_bp, url_prefix='/api/billing')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong"})
