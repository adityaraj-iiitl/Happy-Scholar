import os
import hmac
import hashlib
import time
import requests
from flask import Blueprint, request, jsonify, current_app
from models import User
from database.db import db
from utils.firebase import verify_firebase_token

payment_bp = Blueprint('payment', __name__)

PREMIUM_PRICE_INR = 99

# Global list (simple thread-safe container) to store logs of the last verification attempt
last_verification_logs = []

def log_diagnostic(msg):
    current_app.logger.info(msg)
    last_verification_logs.append(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def get_razorpay_creds():
    key_id = os.getenv('RAZORPAY_KEY_ID')
    key_secret = os.getenv('RAZORPAY_KEY_SECRET')
    return key_id, key_secret

def get_authenticated_user():
    """
    Securely authenticates the user context:
    Extracts and verifies Firebase ID token from the Authorization Bearer header.
    """
    from utils.firebase import firebase_initialized
    
    # Reset logging checklist for new request
    last_verification_logs.clear()
    log_diagnostic("Payment Auth Verification Start:")
    
    auth_header = request.headers.get('Authorization')
    
    log_diagnostic(f"  Authorization Header Present: {'YES' if auth_header else 'NO'}")
    log_diagnostic(f"  Firebase Admin SDK Initialized: {'YES' if firebase_initialized else 'NO'}")

    # 1. Firebase Token Validation
    if auth_header and auth_header.startswith('Bearer '):
        firebase_token = auth_header.split('Bearer ')[1]
        log_diagnostic(f"  Bearer Token Parsed: {'YES' if firebase_token else 'NO'}")
        if firebase_token:
            try:
                decoded = verify_firebase_token(firebase_token)
                firebase_uid = decoded.get('uid')
                log_diagnostic(f"  Token Decode: SUCCESS (verified status: {decoded.get('verified')})")
                log_diagnostic(f"  Firebase UID: {firebase_uid}")
                
                if firebase_uid:
                    user = User.query.filter_by(firebase_uid=firebase_uid).first()
                    log_diagnostic(f"  SQLite User found by Firebase UID: {'YES' if user else 'NO'}")
                    if user:
                        log_diagnostic("Payment Auth: Firebase Verification SUCCESS")
                        return user
            except Exception as e:
                log_diagnostic(f"  Token Verification Exception: {str(e)}")
    else:
        log_diagnostic("  Bearer Token Present: NO")
            
    log_diagnostic("Payment Auth Verification End: Authentication FAILED")
    return None

@payment_bp.route('/price', methods=['GET'])
def get_price():
    return jsonify({
        "price": PREMIUM_PRICE_INR,
        "currency": "INR"
    }), 200

@payment_bp.route('/create-order', methods=['POST'])
def create_order():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized: Secure identification failed"}), 401
    
    key_id, key_secret = get_razorpay_creds()
    if not key_id or not key_secret:
        current_app.logger.error("Razorpay Error: Key ID or Key Secret is missing from environment variables.")
        return jsonify({"error": "Razorpay payment credentials are not configured on the server."}), 500
        
    # Price is 99 INR -> 9900 paise
    amount_paise = PREMIUM_PRICE_INR * 100
    receipt_id = f"receipt_user_{user.id}_{int(time.time())}"
    
    try:
        import razorpay
        client = razorpay.Client(auth=(key_id, key_secret))
        
        order_data = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt_id,
            "payment_capture": 1
        })
        
        return jsonify({
            "order_id": order_data.get("id"),
            "amount": amount_paise,
            "key_id": key_id
        }), 200
    except Exception as e:
        err_msg = str(e)
        current_app.logger.error(f"Razorpay SDK Exception during order creation: {err_msg}")
        return jsonify({"error": f"Failed to create order with Razorpay: {err_msg}"}), 500

@payment_bp.route('/verify-payment', methods=['POST'])
def verify_payment():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized: Secure identification failed"}), 401
        
    data = request.get_json() or {}
    order_id = data.get('razorpay_order_id')
    payment_id = data.get('razorpay_payment_id')
    signature = data.get('razorpay_signature')
    
    if not order_id or not payment_id or not signature:
        return jsonify({"error": "Missing payment verification parameters"}), 400
        
    key_id, key_secret = get_razorpay_creds()
    if not key_id or not key_secret:
        current_app.logger.error("Razorpay Error: Key ID or Key Secret is missing from environment variables.")
        return jsonify({"error": "Razorpay payment credentials are not configured on the server."}), 500
        
    try:
        import razorpay
        client = razorpay.Client(auth=(key_id, key_secret))
        
        # Verify using SDK client utility (raises SignatureVerificationError if invalid)
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        
        # Activate premium
        user.plan = 'premium'
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Payment verified and Premium activated successfully!",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Razorpay Verification SDK Exception: {str(e)}")
        return jsonify({"error": f"Invalid signature. Verification failed: {str(e)}"}), 400

@payment_bp.route('/diagnose', methods=['GET'])
def diagnose_payment():
    key_id, key_secret = get_razorpay_creds()
    
    masked_key = "Missing"
    if key_id:
        if len(key_id) > 10:
            masked_key = f"{key_id[:8]}...{key_id[-4:]}"
        else:
            masked_key = "Configured (too short)"
            
    has_secret = "YES" if key_secret else "NO"
    is_test = "YES" if (key_id and key_id.startswith("rzp_test_")) else "NO"
    is_live = "YES" if (key_id and key_id.startswith("rzp_live_")) else "NO"
    
    # Check Firebase project variables
    from utils.firebase import firebase_initialized
    import firebase_admin
    
    firebase_project = "N/A"
    try:
        if firebase_admin._apps:
            app_instance = firebase_admin.get_app()
            if app_instance.options:
                firebase_project = app_instance.options.get('projectId', 'N/A')
    except Exception:
        pass
        
    diagnostic_info = {
        "Razorpay configuration loaded": "YES" if (key_id and key_secret) else "NO",
        "Key ID configured": "YES" if key_id else "NO",
        "Key ID value (masked)": masked_key,
        "Key Secret configured": has_secret,
        "Mode appears to be TEST": is_test,
        "Mode appears to be LIVE": is_live,
        "Amount (paise)": 9900,
        "Currency": "INR",
        "Firebase Admin SDK Initialized": "YES" if firebase_initialized else "NO",
        "Firebase Project ID": firebase_project,
        "Last verification logs": list(last_verification_logs)
    }
    
    if not key_id or not key_secret:
        diagnostic_info["Order creation"] = "FAILED: Credentials missing"
        return jsonify(diagnostic_info), 200
        
    try:
        import razorpay
        client = razorpay.Client(auth=(key_id, key_secret))
        order = client.order.create({
            "amount": 9900,
            "currency": "INR",
            "receipt": f"diagnose_receipt_{int(time.time())}"
        })
        diagnostic_info["Order creation"] = "SUCCESS"
        diagnostic_info["Sample Order ID"] = order.get("id")
    except Exception as e:
        diagnostic_info["Order creation"] = "FAILED"
        diagnostic_info["Razorpay error"] = str(e)
        current_app.logger.error(f"Razorpay Diagnosis Failed: {str(e)}")
        
    return jsonify(diagnostic_info), 200

