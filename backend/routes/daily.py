from flask import Blueprint, request, jsonify
from database.db import db
from models import DailyEntry
from datetime import datetime

daily_bp = Blueprint('daily', __name__)

@daily_bp.route('', methods=['POST'])
@daily_bp.route('/', methods=['POST'])
def save_daily_entry():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    date_str = data.get('date')
    if not date_str:
        return jsonify({"error": "Date is required"}), 400

    try:
        # Check if entry already exists for this date and user
        entry = DailyEntry.query.filter_by(user_id=user_id, date=date_str).first()
        
        if not entry:
            entry = DailyEntry(user_id=user_id, date=date_str)
            db.session.add(entry)

        # Update values
        entry.sleep_hours = float(data.get('sleep_hours', 0.0))
        entry.sleep_bedtime = data.get('sleep_bedtime', '22:00')
        entry.sleep_wakeup = data.get('sleep_wakeup', '06:00')
        entry.meals = data.get('meals', '')
        entry.water_intake = float(data.get('water_intake', 0.0))
        entry.exercise_mins = int(data.get('exercise_mins', 0))
        entry.mood = data.get('mood', '😐')
        entry.stress_level = int(data.get('stress_level', 3))
        entry.study_hours = float(data.get('study_hours', 0.0))
        entry.coding_hours = float(data.get('coding_hours', 0.0))
        entry.screen_time = float(data.get('screen_time', 0.0))
        entry.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        db.session.commit()
        return jsonify({"message": "Daily entry saved successfully", "entry": entry.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@daily_bp.route('', methods=['GET'])
@daily_bp.route('/', methods=['GET'])
def get_daily_entries():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    date_str = request.args.get('date')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    try:
        if date_str:
            entry = DailyEntry.query.filter_by(user_id=user_id, date=date_str).first()
            if not entry:
                return jsonify({"entry": None}), 200
            return jsonify({"entry": entry.to_dict()}), 200

        query = DailyEntry.query.filter_by(user_id=user_id)
        if start_date:
            query = query.filter(DailyEntry.date >= start_date)
        if end_date:
            query = query.filter(DailyEntry.date <= end_date)
            
        entries = query.order_by(DailyEntry.date.asc()).all()
        return jsonify({"entries": [e.to_dict() for e in entries]}), 200
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
