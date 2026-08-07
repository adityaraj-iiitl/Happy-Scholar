from flask import Blueprint, request, jsonify
from database.db import db
from models import Notification, Assignment, RevisionItem, DailyEntry
from datetime import datetime, timedelta
import random

notifications_bp = Blueprint('notifications', __name__)

MOTIVATIONAL_QUOTES = [
    "The secret of getting ahead is getting started. - Mark Twain",
    "It always seems impossible until it's done. - Nelson Mandela",
    "Don't wish it were easier. Wish you were better. - Jim Rohn",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
    "Your power is in your habits. Keep coding, keep studying!",
    "Consistency beats talent when talent doesn't work hard. Keep your streak alive!"
]

def generate_dynamic_notifications(user_id):
    """
    Analyzes upcoming due items, habits, and tasks to auto-generate helpful, personalized notifications.
    """
    try:
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        # 1. Assignment reminders (due in the next 3 days)
        three_days_later = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        upcoming_assignments = Assignment.query.filter(
            Assignment.user_id == user_id,
            Assignment.completed == False,
            Assignment.due_date >= today_str,
            Assignment.due_date <= three_days_later
        ).all()
        
        for ass in upcoming_assignments:
            msg = f"Assignment Reminder: '{ass.title}' is due soon on {ass.due_date}!"
            # Check if already notified
            exists = Notification.query.filter_by(user_id=user_id, type='assignment', message=msg).first()
            if not exists:
                noti = Notification(
                    user_id=user_id,
                    type='assignment',
                    message=msg,
                    read=False,
                    created_at=today_str
                )
                db.session.add(noti)
                
        # 2. Spaced Repetition / Revision reminders
        due_revisions = RevisionItem.query.filter(
            RevisionItem.user_id == user_id,
            RevisionItem.next_revision_date <= today_str
        ).count()
        
        if due_revisions > 0:
            msg = f"Revision Alert: You have {due_revisions} cards due for revision in your spaced repetition deck!"
            exists = Notification.query.filter_by(user_id=user_id, type='revision', message=msg).first()
            if not exists:
                noti = Notification(
                    user_id=user_id,
                    type='revision',
                    message=msg,
                    read=False,
                    created_at=today_str
                )
                db.session.add(noti)
                
        # 3. Daily Habit check (if it's after 7 PM and hasn't logged)
        curr_hour = datetime.now().hour
        if curr_hour >= 19:
            today_entry = DailyEntry.query.filter_by(user_id=user_id, date=today_str).first()
            if not today_entry:
                msg = "Habit Reminder: You haven't logged your study, exercise, or water habits for today yet. Record it in Daily Entry!"
                exists = Notification.query.filter_by(user_id=user_id, type='study', message=msg).first()
                if not exists:
                    noti = Notification(
                        user_id=user_id,
                        type='study',
                        message=msg,
                        read=False,
                        created_at=today_str
                    )
                    db.session.add(noti)
                    
        # 4. Motivation check: if notifications are empty or as a daily treat
        last_motivation = Notification.query.filter_by(user_id=user_id, type='motivation').order_by(Notification.id.desc()).first()
        if not last_motivation or (last_motivation.created_at != today_str and random.random() < 0.3):
            msg = random.choice(MOTIVATIONAL_QUOTES)
            noti = Notification(
                user_id=user_id,
                type='motivation',
                message=msg,
                read=False,
                created_at=today_str
            )
            db.session.add(noti)
            
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to generate dynamic notifications: {str(e)}")


@notifications_bp.route('', methods=['GET'])
@notifications_bp.route('/', methods=['GET'])
def get_notifications():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        # Generate new notifications based on data analysis
        generate_dynamic_notifications(user_id)
        
        # Return all notifications
        notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.id.desc()).limit(30).all()
        return jsonify([n.to_dict() for n in notifications]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@notifications_bp.route('/mark-read', methods=['POST'])
def mark_read():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    noti_id = data.get('id')
    
    try:
        if noti_id:
            # Mark a specific notification read
            noti = Notification.query.filter_by(id=noti_id, user_id=user_id).first()
            if noti:
                noti.read = True
        else:
            # Mark all read
            Notification.query.filter_by(user_id=user_id, read=False).update({Notification.read: True})
            
        db.session.commit()
        return jsonify({"message": "Notifications updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
