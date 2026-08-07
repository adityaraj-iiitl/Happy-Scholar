from flask import Blueprint, request, jsonify
from database.db import db
from models import PomodoroSession
from datetime import datetime

pomodoro_bp = Blueprint('pomodoro', __name__)

@pomodoro_bp.route('', methods=['GET'])
@pomodoro_bp.route('/', methods=['GET'])
def get_pomodoro_stats():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        sessions = PomodoroSession.query.filter_by(user_id=user_id).order_by(PomodoroSession.date.desc()).all()
        
        # Calculate summary statistics
        total_sessions = len(sessions)
        total_minutes = sum(s.duration_mins for s in sessions)
        
        return jsonify({
            "sessions": [s.to_dict() for s in sessions],
            "summary": {
                "total_sessions": total_sessions,
                "total_minutes": total_minutes
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pomodoro_bp.route('', methods=['POST'])
@pomodoro_bp.route('/', methods=['POST'])
def log_pomodoro_session():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    date_str = data.get('date') or datetime.now().strftime("%Y-%m-%d")
    duration = int(data.get('duration_mins', 25))
    completed_time = datetime.now().strftime("%H:%M:%S")

    try:
        new_session = PomodoroSession(
            user_id=user_id,
            date=date_str,
            duration_mins=duration,
            completed_at=completed_time
        )
        db.session.add(new_session)
        db.session.commit()
        return jsonify({"message": "Pomodoro session logged", "session": new_session.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
