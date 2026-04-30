from flask import Blueprint, request, jsonify
from database import db
from models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not all([username, email, phone, password]):
        return jsonify({"error": "Username, email, phone, and password are required"}), 400

    # Check for uniqueness
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    if User.query.filter_by(phone=phone).first():
        return jsonify({"error": "Phone number already exists"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        phone=phone,
        password_hash=hashed_password,
        full_name=data.get('full_name', username)
    )

    db.session.add(new_user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error"}), 500

    return jsonify({
        "message": "User created successfully",
        "user": new_user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
        
    user = User.query.filter_by(username=username).first()
    
    # We'll use check_password_hash for new users and plain text match for old demo users to prevent breaking existing ones
    if user:
        valid_password = False
        if user.password_hash.startswith('scrypt:') or user.password_hash.startswith('pbkdf2:'):
            valid_password = check_password_hash(user.password_hash, password)
        else:
            # Fallback for old plain text passwords
            valid_password = (user.password_hash == password)
            
        if valid_password:
            return jsonify({
                "user": user.to_dict(),
                "token": "fake-jwt-token-for-demo"
            }), 200
        
    return jsonify({"error": "Invalid credentials"}), 401
