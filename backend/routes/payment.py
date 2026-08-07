import os
import hmac
import hashlib
import time
import requests
from flask import Blueprint, request, jsonify
from models import User
from database.db import db

payment_bp = Blueprint('payment', __name__)

PREMIUM_PRICE_INR = 99

def get_razorpay_creds():
    key_id = os.getenv('RAZORPAY_KEY_ID')
    key_secret = os.getenv('RAZORPAY_KEY_SECRET')
    return key_id, key_secret

@payment_bp.route('/price', methods=['GET'])
def get_price():
    return jsonify({
        "price": PREMIUM_PRICE_INR,
        "currency": "INR"
    }), 200

@payment_bp.route('/create-order', methods=['POST'])
def create_order():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    key_id, key_secret = get_razorpay_creds()
    
    # Price is 99 INR -> 9900 paise
    amount_paise = PREMIUM_PRICE_INR * 100
    
    payload = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"receipt_user_{user_id}_{int(time.time())}",
        "payment_capture": 1
    }
    
    try:
        response = requests.post(
            "https://api.razorpay.com/v1/orders",
            auth=(key_id, key_secret),
            json=payload,
            timeout=15
        )
        if response.status_code != 200:
            print(f"Razorpay Order Error: {response.text}")
            return jsonify({"error": "Failed to create order with Razorpay"}), 500
            
        order_data = response.json()
        return jsonify({
            "order_id": order_data.get("id"),
            "amount": amount_paise,
            "key_id": key_id
        }), 200
    except Exception as e:
        return jsonify({"error": f"Error creating payment order: {str(e)}"}), 500

@payment_bp.route('/verify-payment', methods=['POST'])
def verify_payment():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json() or {}
    order_id = data.get('razorpay_order_id')
    payment_id = data.get('razorpay_payment_id')
    signature = data.get('razorpay_signature')
    
    if not order_id or not payment_id or not signature:
        return jsonify({"error": "Missing payment verification parameters"}), 400
        
    key_id, key_secret = get_razorpay_creds()
    
    try:
        msg = f"{order_id}|{payment_id}".encode('utf-8')
        generated_signature = hmac.new(
            key_secret.encode('utf-8'),
            msg,
            hashlib.sha256
        ).hexdigest()
        
        if hmac.compare_digest(generated_signature, signature):
            # Activate premium
            user.plan = 'premium'
            db.session.commit()
            return jsonify({
                "success": True,
                "message": "Payment verified and Premium activated successfully!",
                "user": user.to_dict()
            }), 200
        else:
            return jsonify({"error": "Invalid signature. Verification failed."}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Verification error: {str(e)}"}), 500
