import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from database.db import db
from database.patcher import patch_database

# Load environment variables
load_dotenv()

# Import existing blueprints
from routes.auth import auth_bp
from routes.daily import daily_bp
from routes.attendance import attendance_bp
from routes.assignments import assignments_bp
from routes.pomodoro import pomodoro_bp
from routes.ai import ai_bp

# Import new blueprints
from routes.notes import notes_bp
from routes.camera import camera_bp
from routes.planner import planner_bp
from routes.quiz import quiz_bp
from routes.revision import revision_bp
from routes.chatbot import chatbot_bp
from routes.gamification import gamification_bp
from routes.notifications import notifications_bp
from routes.payment import payment_bp

app = Flask(__name__)
CORS(app)

# Session configurations
app.secret_key = os.getenv('SECRET_KEY', 'studentsync_secret_key_123')

# Database configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.getenv('SQLITE_DB_PATH')
if db_path:
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'studentsync.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB
db.init_app(app)

# Configure SQLite pragmas for concurrency
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()
    except Exception:
        pass

# Verify and prepare database directory
db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
if db_uri.startswith('sqlite:///'):
    resolved_db_path = db_uri.replace('sqlite:///', '')
    if not os.path.isabs(resolved_db_path):
        resolved_db_path = os.path.join(BASE_DIR, resolved_db_path)
    
    db_dir = os.path.dirname(resolved_db_path)
    
    print("Database Path Diagnostics:")
    print(f"  Database URI: {db_uri}")
    print(f"  Resolved path: {resolved_db_path}")
    print(f"  Directory path: {db_dir}")
    
    if db_dir:
        dir_exists = os.path.exists(db_dir)
        print(f"  Directory exists: {'YES' if dir_exists else 'NO'}")
        if not dir_exists:
            try:
                os.makedirs(db_dir, exist_ok=True)
                print("  Directory created: YES")
            except Exception as e:
                print(f"  Directory creation failed: {str(e)}")
        
        # Test parent folder writability
        try:
            test_file = os.path.join(db_dir, '.db_write_test')
            with open(test_file, 'w') as f:
                f.write('check')
            os.remove(test_file)
            print("  Directory writable: YES")
        except Exception as e:
            print(f"  Directory writable: NO ({str(e)})")

# Initialize and create database tables securely
with app.app_context():
    try:
        db.create_all()
        print("Database tables initialized successfully (db.create_all).")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")

# Run database schema migrations/patches after the DB file is guaranteed to exist
patch_database(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(daily_bp, url_prefix='/api/daily')
app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
app.register_blueprint(pomodoro_bp, url_prefix='/api/pomodoro')
app.register_blueprint(ai_bp, url_prefix='/api/ai')

# Register new feature Blueprints
app.register_blueprint(notes_bp, url_prefix='/api/notes')
app.register_blueprint(camera_bp, url_prefix='/api/camera')
app.register_blueprint(planner_bp, url_prefix='/api/planner')
app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
app.register_blueprint(revision_bp, url_prefix='/api/revision')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
app.register_blueprint(gamification_bp, url_prefix='/api/gamification')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(payment_bp, url_prefix='/api/payment')

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "message": "Welcome to HappyScholar AI API"
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)