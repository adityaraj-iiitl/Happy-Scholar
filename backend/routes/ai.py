from flask import Blueprint, request, jsonify
from database.db import db
from models import DailyEntry, ProductRecommendation
from utils.gemini import generate_wellness_analysis, generate_meal_suggestions, generate_product_recommendations

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/analysis', methods=['GET'])
def get_ai_analysis():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # Fetch last 14 logs to give the AI good context of trends
        entries = DailyEntry.query.filter_by(user_id=user_id).order_by(DailyEntry.date.desc()).limit(14).all()
        # Convert to dictionary and reverse to make it chronological
        entries_dicts = [e.to_dict() for e in reversed(entries)]
        
        # Generate analysis
        analysis = generate_wellness_analysis(entries_dicts)

        # Calculate Burnout Risk dynamically
        burnout_detected = False
        burnout_reason = ""
        
        # Check if we have recent entries to check burnout
        if len(entries) >= 3:
            recent_3 = entries[:3]
            recent_sleep = [e.sleep_hours for e in recent_3]
            recent_stress = [e.stress_level for e in recent_3]
            recent_study = [e.study_hours + e.coding_hours for e in recent_3]
            
            # Condition: Avg Sleep < 6, Avg Stress >= 4, Avg study+coding >= 8
            avg_sleep = sum(recent_sleep) / 3
            avg_stress = sum(recent_stress) / 3
            avg_study = sum(recent_study) / 3
            
            if avg_sleep < 6.0 and avg_stress >= 4.0 and avg_study >= 8.0:
                burnout_detected = True
                burnout_reason = f"Burnout risk detected. Over the last 3 days, you averaged only {avg_sleep:.1f} hours of sleep with a high stress level of {avg_stress:.1f}/5 and very high study load of {avg_study:.1f} hours. Consider taking a break!"
        elif len(entries) > 0:
            # Single entry burnout check as fallback
            latest = entries[0]
            if latest.sleep_hours < 6.0 and latest.stress_level >= 4 and (latest.study_hours + latest.coding_hours) >= 8.0:
                burnout_detected = True
                burnout_reason = f"Burnout risk detected today. You slept {latest.sleep_hours:.1f} hours, had stress level {latest.stress_level}/5, and worked {latest.study_hours + latest.coding_hours:.1f} hours. Please rest!"

        analysis["burnout_detected"] = burnout_detected
        analysis["burnout_reason"] = burnout_reason

        # Calculate Streaks
        # We can calculate daily entry streak, water streak, study streak, exercise streak
        # Let's write a robust streak calculation algorithm based on ordered logs
        streaks = calculate_streaks(entries)
        analysis["streaks"] = streaks

        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({"error": f"AI analysis error: {str(e)}"}), 500

@ai_bp.route('/meals', methods=['GET'])
def get_meal_recs():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        entries = DailyEntry.query.filter_by(user_id=user_id).order_by(DailyEntry.date.desc()).limit(7).all()
        entries_dicts = [e.to_dict() for e in reversed(entries)]
        
        meal_suggestions = generate_meal_suggestions(entries_dicts)
        return jsonify({"meals": meal_suggestions}), 200
    except Exception as e:
        return jsonify({"error": f"Meal suggestions error: {str(e)}"}), 500

def calculate_streaks(entries):
    """
    Computes current streak badge counts for sleep (7h+), water (2.5L+), study (3h+), and exercise (15m+).
    Assumes entries are ordered desc by date (latest first).
    """
    streaks = {
        "sleep": 0,
        "water": 0,
        "study": 0,
        "exercise": 0
    }
    
    if not entries:
        return streaks

    # Let's count consecutive days matching thresholds
    # We will stop counting for a category as soon as the streak is broken
    broken = {"sleep": False, "water": False, "study": False, "exercise": False}

    for entry in entries:
        # Sleep streak (target: >= 7 hours)
        if not broken["sleep"]:
            if entry.sleep_hours >= 7.0:
                streaks["sleep"] += 1
            else:
                broken["sleep"] = True

        # Water streak (target: >= 2.5 liters or glasses, let's say >= 2.5)
        if not broken["water"]:
            if entry.water_intake >= 2.5:
                streaks["water"] += 1
            else:
                broken["water"] = True

        # Study streak (target: >= 3 hours study + coding)
        if not broken["study"]:
            if (entry.study_hours + entry.coding_hours) >= 3.0:
                streaks["study"] += 1
            else:
                broken["study"] = True

        # Exercise streak (target: >= 15 mins)
        if not broken["exercise"]:
            if entry.exercise_mins >= 15:
                streaks["exercise"] += 1
            else:
                broken["exercise"] = True

    return streaks


@ai_bp.route('/recommendations', methods=['GET'])
def get_product_recommendations():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    refresh = request.args.get('refresh', 'false').lower() == 'true'

    try:
        # Check database cache first if not refreshing
        if not refresh:
            cached_items = ProductRecommendation.query.filter_by(user_id=user_id).all()
            if cached_items:
                return jsonify([item.to_dict() for item in cached_items]), 200

        # Fetch recent entries to analyze lifestyle trends (limit 14)
        entries = DailyEntry.query.filter_by(user_id=user_id).order_by(DailyEntry.date.desc()).limit(14).all()
        entries_dicts = [e.to_dict() for e in reversed(entries)]

        # Generate recommendations
        recs = generate_product_recommendations(entries_dicts)

        # Clear existing cache for the user
        ProductRecommendation.query.filter_by(user_id=user_id).delete()

        # Save new entries into SQLite cache
        for rec in recs:
            db_item = ProductRecommendation(
                user_id=user_id,
                name=rec.get('name'),
                category=rec.get('category'),
                reason=rec.get('reason'),
                estimated_price=rec.get('estimated_price'),
                amazon_search=rec.get('amazon_search'),
                flipkart_search=rec.get('flipkart_search'),
                confidence=rec.get('confidence')
            )
            db.session.add(db_item)
        
        db.session.commit()

        # Re-query saved items to return correctly
        saved_recs = ProductRecommendation.query.filter_by(user_id=user_id).all()
        return jsonify([item.to_dict() for item in saved_recs]), 200

    except Exception as e:
        db.session.rollback()
        # Fallback to cache if database transaction fails
        try:
            cached_items = ProductRecommendation.query.filter_by(user_id=user_id).all()
            if cached_items:
                return jsonify([item.to_dict() for item in cached_items]), 200
        except Exception:
            pass
        return jsonify({"error": f"Product recommendations error: {str(e)}"}), 500
