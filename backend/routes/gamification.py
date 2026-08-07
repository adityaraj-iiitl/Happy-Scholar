from flask import Blueprint, request, jsonify
from database.db import db
from models import User, Note, SolvedQuestion, QuizAttempt, PomodoroSession, DailyEntry
from datetime import datetime, timedelta

gamification_bp = Blueprint('gamification', __name__)

def update_streak(user):
    """
    Checks the last active date of the user and updates their daily streak.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    try:
        if not user.last_active_date:
            user.streak = 1
            user.last_active_date = today_str
        elif user.last_active_date == yesterday_str:
            user.streak += 1
            user.last_active_date = today_str
        elif user.last_active_date != today_str:
            # User missed a day or more, reset streak
            user.streak = 1
            user.last_active_date = today_str
            
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to update streak: {str(e)}")


def get_badges_earned(user):
    """
    Determines which badges the user has unlocked based on current database records.
    Returns a list of badges with titles, descriptions, and icon/styling names.
    """
    badges = []
    
    # 1. Check Streaks
    if user.streak >= 3:
        badges.append({
            "title": "Streak Starter",
            "description": "Maintain a daily login streak of 3 days.",
            "icon": "Flame",
            "color": "text-orange-500 bg-orange-500/10"
        })
    if user.streak >= 7:
        badges.append({
            "title": "Streak Legend",
            "description": "Maintain a daily login streak of 7 days.",
            "icon": "Award",
            "color": "text-yellow-500 bg-yellow-500/10"
        })
        
    # 2. Check Notes Created
    notes_count = Note.query.filter_by(user_id=user.id).count()
    if notes_count >= 1:
        badges.append({
            "title": "First Note",
            "description": "Create your first AI Study Note.",
            "icon": "FileText",
            "color": "text-indigo-500 bg-indigo-500/10"
        })
    if notes_count >= 5:
        badges.append({
            "title": "Knowledge Keeper",
            "description": "Create 5 or more AI Study Notes.",
            "icon": "BookOpen",
            "color": "text-purple-500 bg-purple-500/10"
        })
        
    # 3. Check Solved Questions
    solved_count = SolvedQuestion.query.filter_by(user_id=user.id).count()
    if solved_count >= 3:
        badges.append({
            "title": "Problem Solver",
            "description": "Solve 3 or more questions using AI Camera Solver.",
            "icon": "Camera",
            "color": "text-emerald-500 bg-emerald-500/10"
        })
        
    # 4. Check Quiz Performance
    attempts = QuizAttempt.query.filter_by(user_id=user.id).all()
    if len(attempts) >= 1:
        badges.append({
            "title": "Trivia Taker",
            "description": "Complete your first AI generated quiz.",
            "icon": "HelpCircle",
            "color": "text-blue-500 bg-blue-500/10"
        })
    perfect_quizzes = [a for a in attempts if a.score == a.total and a.total > 0]
    if len(perfect_quizzes) >= 1:
        badges.append({
            "title": "Quiz Whiz",
            "description": "Get a perfect score (100%) on any quiz.",
            "icon": "Zap",
            "color": "text-amber-500 bg-amber-500/10"
        })
        
    # 5. Check Pomodoro sessions
    pomo_count = PomodoroSession.query.filter_by(user_id=user.id).count()
    if pomo_count >= 5:
        badges.append({
            "title": "Focus Master",
            "description": "Complete 5 or more Pomodoro focus sessions.",
            "icon": "Timer",
            "color": "text-rose-500 bg-rose-500/10"
        })
        
    # 6. Check levels
    if user.level >= 2:
        badges.append({
            "title": "Level Up",
            "description": "Reach Level 2 or higher.",
            "icon": "TrendingUp",
            "color": "text-cyan-500 bg-cyan-500/10"
        })
        
    return badges


@gamification_bp.route('/status', methods=['GET'])
def get_status():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Trigger streak update on access
    update_streak(user)
    
    # Calculate goals progress
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Daily Goals
    # - Complete a Pomodoro session today
    daily_pomo_done = PomodoroSession.query.filter_by(user_id=user.id, date=today_str).count() > 0
    # - Log a habit entry today
    daily_entry_done = DailyEntry.query.filter_by(user_id=user.id, date=today_str).first() is not None
    # - Generate/edit a note today
    daily_note_done = Note.query.filter(Note.user_id == user.id, Note.created_at == today_str).count() > 0
    
    daily_goals = [
        {"title": "Complete 1 Pomodoro Session", "completed": daily_pomo_done, "xp": 15},
        {"title": "Log Daily Habit Habits", "completed": daily_entry_done, "xp": 10},
        {"title": "Create an AI Note", "completed": daily_note_done, "xp": 15}
    ]
    
    # 2. Weekly Goals
    # Calculate week range
    start_of_week = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime("%Y-%m-%d")
    
    # - Complete 3 pomodoros this week
    week_pomos = PomodoroSession.query.filter(PomodoroSession.user_id == user.id, PomodoroSession.date >= start_of_week).count()
    # - Study at least 5 hours (study + coding hours from logs) this week
    week_logs = DailyEntry.query.filter(DailyEntry.user_id == user.id, DailyEntry.date >= start_of_week).all()
    week_study_hours = sum((log.study_hours or 0.0) + (log.coding_hours or 0.0) for log in week_logs)
    
    weekly_goals = [
        {"title": "Complete 3 Pomodoro Focus Sessions", "current": min(week_pomos, 3), "target": 3, "completed": week_pomos >= 3, "xp": 40},
        {"title": "Study & Code for 5 Hours", "current": round(min(week_study_hours, 5.0), 1), "target": 5.0, "completed": week_study_hours >= 5.0, "xp": 50}
    ]
    
    # Fetch Badges
    badges = get_badges_earned(user)
    
    # Next level calculation (e.g. 100 XP per level)
    current_level_xp = user.xp % 100
    next_level_target_xp = 100
    
    return jsonify({
        "xp": user.xp,
        "level": user.level,
        "coins": user.coins,
        "streak": user.streak,
        "current_level_xp": current_level_xp,
        "next_level_target_xp": next_level_target_xp,
        "daily_goals": daily_goals,
        "weekly_goals": weekly_goals,
        "badges": badges
    }), 200


@gamification_bp.route('/add-xp', methods=['POST'])
def add_xp():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json() or {}
    try:
        amount = int(data.get('xp', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid XP amount"}), 400
    
    if amount <= 0:
        return jsonify({"error": "Invalid XP amount"}), 400
        
    try:
        old_level = user.level
        user.xp += amount
        
        # Calculate new level: e.g., level 1: 0-99 XP, level 2: 100-199 XP
        new_level = (user.xp // 100) + 1
        level_up = False
        
        if new_level > old_level:
            user.level = new_level
            level_up = True
            # Reward 10 coins on level up
            user.coins += 10
            
        # Also reward standard coins (1 coin for every 10 XP)
        coins_earned = amount // 10
        user.coins += coins_earned
        
        db.session.commit()
        
        return jsonify({
            "message": "XP rewarded",
            "xp_added": amount,
            "coins_added": coins_earned + (10 if level_up else 0),
            "total_xp": user.xp,
            "level": user.level,
            "coins": user.coins,
            "level_up": level_up
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
