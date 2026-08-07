from flask import Blueprint, request, jsonify
from database.db import db
from models import StudyTask, User
from utils.gemini import call_gemini
import json
from datetime import datetime, timedelta

planner_bp = Blueprint('planner', __name__)

def reward_planner_xp(user_id, amount=10):
    """
    Rewards the user XP for planner activities.
    """
    try:
        user = User.query.get(user_id)
        if user:
            user.xp += amount
            new_level = (user.xp // 100) + 1
            if new_level > user.level:
                user.level = new_level
                user.coins += 10
            user.coins += max(1, amount // 10)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to reward XP: {str(e)}")


@planner_bp.route('', methods=['GET'])
@planner_bp.route('/', methods=['GET'])
def get_schedule():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        tasks = StudyTask.query.filter_by(user_id=user_id).order_by(StudyTask.scheduled_date.asc()).all()
        
        # Check for missed tasks: scheduled before today and not completed
        today_str = datetime.now().strftime("%Y-%m-%d")
        updated = False
        for task in tasks:
            if task.scheduled_date < today_str and not task.completed and not task.missed:
                task.missed = True
                updated = True
                
        if updated:
            db.session.commit()
            # Fetch updated list
            tasks = StudyTask.query.filter_by(user_id=user_id).order_by(StudyTask.scheduled_date.asc()).all()
            
        return jsonify([t.to_dict() for t in tasks]), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@planner_bp.route('/generate', methods=['POST'])
def generate_schedule():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    subjects = data.get('subjects', []) # Array of subject names
    exam_date = data.get('exam_date') # YYYY-MM-DD
    
    if not subjects or not exam_date:
        return jsonify({"error": "Subjects and exam date are required"}), 400
        
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Calculate days left
    try:
        today_dt = datetime.strptime(today_str, "%Y-%m-%d")
        exam_dt = datetime.strptime(exam_date, "%Y-%m-%d")
        days_left = (exam_dt - today_dt).days
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
    if days_left <= 0:
        return jsonify({"error": "Exam date must be in the future."}), 400
        
    prompt = f"""
    You are an AI academic advisor. Design a daily study plan for a student leading up to their exams.
    
    Subjects: {", ".join(subjects)}
    Current Date: {today_str}
    Exam Date: {exam_date}
    Days Left: {days_left}
    
    Generate a day-by-day study schedule starting from today up to the day before the exam.
    Create exactly 1 or 2 specific tasks per day. Keep the daily workload reasonable (e.g. 30 to 90 minutes per task).
    
    Return your response strictly as a JSON array of objects, where each object has these exact keys:
    - "subject": The name of the subject being studied.
    - "title": A descriptive study milestone/topic (e.g., "Review Integration Formulas", "Read Chapter 3 on OOP Principles")
    - "scheduled_date": The specific date for this task in YYYY-MM-DD format (must be between {today_str} and the day before {exam_date}).
    - "duration_mins": Estimated study duration in minutes (integer, e.g., 45, 60).
    
    Do not include markdown code block syntax (like ```json). Return only the JSON array.
    """
    
    res_text = call_gemini(prompt, response_mime_type="application/json")
    
    tasks_data = None
    if res_text:
        try:
            cleaned_text = res_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            tasks_data = json.loads(cleaned_text.strip())
        except Exception as e:
            print(f"Warning: Failed to parse Gemini response: {str(e)}")
            tasks_data = None

    if not tasks_data:
        print("Patcher/Planner: Gemini failed or returned invalid JSON. Using local fallback generator.")
        try:
            tasks_data = []
            curr_date = datetime.strptime(today_str, "%Y-%m-%d")
            # Generate daily study plan up to the day before the exam
            for d in range(days_left):
                scheduled_dt = curr_date + timedelta(days=d)
                # Assign subject round-robin
                subject = subjects[d % len(subjects)]
                subject_study_count = d // len(subjects)
                
                # Dynamic title based on how many times we've studied this subject
                if subject_study_count == 0:
                    title = f"Intro & Core Concepts for {subject}"
                elif subject_study_count == 1:
                    title = f"Review Key Formulas & Notes of {subject}"
                elif subject_study_count == 2:
                    title = f"Solve Practice Problems & PYQs of {subject}"
                elif subject_study_count == 3:
                    title = f"Mock Test & Final Revision of {subject}"
                else:
                    title = f"General revision and weak areas of {subject}"
                
                tasks_data.append({
                    "subject": subject,
                    "title": title,
                    "scheduled_date": scheduled_dt.strftime("%Y-%m-%d"),
                    "duration_mins": 60
                })
        except Exception as e:
            return jsonify({"error": f"Fallback schedule generation failed: {str(e)}"}), 500
        
    try:
        # Clear existing uncompleted study tasks
        StudyTask.query.filter_by(user_id=user_id, completed=False).delete()
        
        for t in tasks_data:
            new_task = StudyTask(
                user_id=user_id,
                subject=t.get('subject', 'General'),
                title=t.get('title', 'Study Session'),
                scheduled_date=t.get('scheduled_date', today_str),
                duration_mins=int(t.get('duration_mins', 45)),
                completed=False,
                missed=False
            )
            db.session.add(new_task)
            
        db.session.commit()
        
        # Reward XP for planning
        reward_planner_xp(user_id, 20)
        
        # Fetch and return all tasks
        all_tasks = StudyTask.query.filter_by(user_id=user_id).order_by(StudyTask.scheduled_date.asc()).all()
        return jsonify([t.to_dict() for t in all_tasks]), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save study schedule: {str(e)}"}), 500


@planner_bp.route('/task/<int:task_id>', methods=['PUT'])
def toggle_task(task_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        task = StudyTask.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404
            
        data = request.get_json() or {}
        # Toggle completed
        old_completed = task.completed
        task.completed = data.get('completed', not task.completed)
        
        # If it was missed but is now completed, reset missed flag
        if task.completed:
            task.missed = False
            
        db.session.commit()
        
        # Reward XP if changing from uncompleted to completed
        if task.completed and not old_completed:
            reward_planner_xp(user_id, 10)
            
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@planner_bp.route('/replan', methods=['POST'])
def replan_schedule():
    """
    Adaptive scheduling: identifies missed tasks and redistributes them
    alongside remaining tasks leading up to the exam date.
    """
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    exam_date = data.get('exam_date')
    
    if not exam_date:
        # Try to extract the exam date from existing tasks
        last_task = StudyTask.query.filter_by(user_id=user_id).order_by(StudyTask.scheduled_date.desc()).first()
        if last_task:
            # Assume exam date is the day after the last scheduled task
            last_date_dt = datetime.strptime(last_task.scheduled_date, "%Y-%m-%d")
            exam_date = (last_date_dt + timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            return jsonify({"error": "Exam date is required"}), 400
            
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Fetch remaining uncompleted tasks (including missed ones)
    remaining_tasks = StudyTask.query.filter_by(user_id=user_id, completed=False).all()
    if not remaining_tasks:
        return jsonify({"message": "No uncompleted tasks to reschedule."}), 200
        
    tasks_to_replan = [{"subject": t.subject, "title": t.title, "duration_mins": t.duration_mins} for t in remaining_tasks]
    
    # 2. Delete the uncompleted database rows (we will recreate them)
    try:
        StudyTask.query.filter_by(user_id=user_id, completed=False).delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to reset uncompleted tasks: {str(e)}"}), 500
    
    # 3. Call Gemini to reschedule these specific tasks starting from today up to the exam date
    prompt = f"""
    You are an AI study assistant. A student has missed some tasks or wants to re-optimize their study schedule.
    
    Here are the uncompleted tasks that need to be scheduled:
    {json.dumps(tasks_to_replan, indent=2)}
    
    Please reschedule these tasks starting from today ({today_str}) up to the day before the exam ({exam_date}).
    Distribute the tasks evenly across the available days.
    
    Return your response strictly as a JSON array of objects, where each object has these exact keys:
    - "subject": The name of the subject.
    - "title": The study topic milestone.
    - "scheduled_date": The new date in YYYY-MM-DD format (must be between {today_str} and the day before {exam_date}).
    - "duration_mins": Estimated study duration in minutes (integer).
    
    Do not include markdown code block syntax. Return only the JSON array.
    """
    
    res_text = call_gemini(prompt, response_mime_type="application/json")
    if not res_text:
        # Fallback: distribute them sequentially (1 per day) manually
        try:
            curr_date = datetime.strptime(today_str, "%Y-%m-%d")
            exam_dt = datetime.strptime(exam_date, "%Y-%m-%d")
            for idx, task_info in enumerate(tasks_to_replan):
                scheduled_dt = curr_date + timedelta(days=idx)
                if scheduled_dt >= exam_dt:
                    scheduled_dt = exam_dt - timedelta(days=1)
                
                new_task = StudyTask(
                    user_id=user_id,
                    subject=task_info['subject'],
                    title=task_info['title'],
                    scheduled_date=scheduled_dt.strftime("%Y-%m-%d"),
                    duration_mins=task_info['duration_mins'],
                    completed=False,
                    missed=False
                )
                db.session.add(new_task)
            db.session.commit()
            
            all_tasks = StudyTask.query.filter_by(user_id=user_id).order_by(StudyTask.scheduled_date.asc()).all()
            return jsonify([t.to_dict() for t in all_tasks]), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Rescheduling failed: {str(e)}"}), 500
            
    try:
        cleaned_text = res_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        rescheduled_data = json.loads(cleaned_text.strip())
        
        for t in rescheduled_data:
            new_task = StudyTask(
                user_id=user_id,
                subject=t.get('subject', 'General'),
                title=t.get('title', 'Study Session'),
                scheduled_date=t.get('scheduled_date', today_str),
                duration_mins=int(t.get('duration_mins', 45)),
                completed=False,
                missed=False
            )
            db.session.add(new_task)
            
        db.session.commit()
        
        all_tasks = StudyTask.query.filter_by(user_id=user_id).order_by(StudyTask.scheduled_date.asc()).all()
        return jsonify([t.to_dict() for t in all_tasks]), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to parse replanned schedule: {str(e)}"}), 500
