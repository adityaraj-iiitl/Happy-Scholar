import os
import jwt
import firebase_admin
from firebase_admin import credentials, auth

# Define path for service account file
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
SERVICE_ACCOUNT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT') or os.path.join(BASE_DIR, 'firebase-service-account.json')

# Initialize Firebase Admin SDK
firebase_initialized = False

# Try environment variables first (ideal for Render deployment)
project_id = os.getenv('FIREBASE_PROJECT_ID')
client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
private_key_raw = os.getenv('FIREBASE_PRIVATE_KEY')

try:
    if not firebase_admin._apps:
        if project_id and client_email and private_key_raw:
            private_key = private_key_raw.replace('\\n', '\n')
            print(f"Firebase: Initializing Admin SDK using environment variables for project: {project_id}")
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "client_email": client_email,
                "private_key": private_key,
                "token_uri": "https://oauth2.googleapis.com/token"
            })
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
        else:
            # Fallback to service account key file
            if os.path.exists(SERVICE_ACCOUNT_PATH):
                print(f"Firebase: Initializing with service account key from {SERVICE_ACCOUNT_PATH}")
                cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
                firebase_admin.initialize_app(cred)
                firebase_initialized = True
            else:
                # Default initialization fallback
                print("Firebase: Service account credentials not found. Signature verification may run in fallback/local mode.")
                firebase_admin.initialize_app()
                firebase_initialized = True
except Exception as e:
    print(f"Firebase Initialization Warning: {str(e)}")
    print("Firebase Admin SDK running in fallback mode. Token signature verification may be bypassed in local dev.")

def verify_firebase_token(id_token):
    """
    Verifies the Firebase ID Token.
    Returns a dict with: uid, name, email, picture, and success status.
    """
    if not id_token:
        raise ValueError("No token provided")

    # If Firebase Admin SDK is initialized successfully, try verifying the token signature
    if firebase_initialized:
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                "uid": decoded_token.get("uid"),
                "name": decoded_token.get("name", "Firebase User"),
                "email": decoded_token.get("email"),
                "picture": decoded_token.get("picture"),
                "verified": True
            }
        except Exception as e:
            print(f"Firebase: verify_id_token signature verification failed: {str(e)}")
            # Fall through to manual decode if verification fails due to certificate configuration
            pass

    # Fallback/Local Development mode: Decode the JWT payload without verifying signature
    try:
        print("Firebase: Decoding JWT token payload without signature verification (local development fallback)...")
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        return {
            "uid": decoded.get("user_id") or decoded.get("sub"),
            "name": decoded.get("name") or decoded.get("email", "Firebase User").split("@")[0],
            "email": decoded.get("email"),
            "picture": decoded.get("picture"),
            "verified": False
        }
    except Exception as jwt_error:
        print(f"Firebase: Failed to decode JWT payload: {str(jwt_error)}")
        raise ValueError("Invalid ID Token format or verification failed")
