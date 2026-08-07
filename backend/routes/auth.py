from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import db
from models import User
from utils.firebase import verify_firebase_token
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    email = email.lower().strip()

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    try:
        hashed_password = generate_password_hash(password)
        new_user = User(name=name, email=email, password_hash=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            "message": "User registered successfully",
            "user": new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    email = email.lower().strip()

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
def get_me():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"user": user.to_dict()}), 200

@auth_bp.route('/firebase-login', methods=['POST'])
def firebase_login():
    data = request.get_json() or {}
    id_token = data.get('idToken')

    if not id_token:
        return jsonify({"error": "Firebase ID Token is required"}), 400

    try:
        # Verify Firebase ID token
        decoded_user = verify_firebase_token(id_token)
        firebase_uid = decoded_user.get("uid")
        email = decoded_user.get("email")
        name = decoded_user.get("name")
        picture = decoded_user.get("picture")

        if not firebase_uid or not email:
            return jsonify({"error": "Failed to retrieve user details from token"}), 400

        email = email.lower().strip()

        # Check if user exists by firebase_uid or email
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        
        # If user does not exist by firebase_uid, check by email
        if not user:
            user = User.query.filter_by(email=email).first()
            if user:
                # Update existing user with firebase_uid and profile_photo
                user.firebase_uid = firebase_uid
                if picture:
                    user.profile_photo = picture
                db.session.commit()
            else:
                # Create a new user since they don't exist by firebase_uid or email
                dummy_password = generate_password_hash("firebase_oauth_user_" + firebase_uid)
                user = User(
                    name=name,
                    email=email,
                    password_hash=dummy_password,
                    firebase_uid=firebase_uid,
                    profile_photo=picture,
                    created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                )
                db.session.add(user)
                db.session.commit()

        return jsonify({
            "message": "Firebase login successful",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error in firebase-login route: {str(e)}")
        return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
