import os
from flask import Flask, jsonify
from flask_cors import CORS
from database.db import db
from database.patcher import patch_database

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
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'studentsync.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB
db.init_app(app)

# Run database schema migrations/patches
patch_database(app)

# Create tables if they do not exist
with app.app_context():
    try:
        db.create_all()
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")

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