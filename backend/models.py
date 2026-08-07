from database.db import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=True)
    firebase_uid = db.Column(db.String(100), unique=True, nullable=True)
    profile_photo = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.String(20), nullable=True)

    # Gamification
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    coins = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.String(10), nullable=True) # YYYY-MM-DD
    
    # Premium subscription & Camera Solver usage
    plan = db.Column(db.String(20), default='free')
    camera_solver_daily_count = db.Column(db.Integer, default=0)
    camera_solver_last_used_date = db.Column(db.String(10), nullable=True) # YYYY-MM-DD

    # Relationships
    entries = db.relationship('DailyEntry', backref='user', lazy=True, cascade="all, delete-orphan")
    attendance = db.relationship('Attendance', backref='user', lazy=True, cascade="all, delete-orphan")
    assignments = db.relationship('Assignment', backref='user', lazy=True, cascade="all, delete-orphan")
    pomodoro_sessions = db.relationship('PomodoroSession', backref='user', lazy=True, cascade="all, delete-orphan")
    reports = db.relationship('WeeklyReport', backref='user', lazy=True, cascade="all, delete-orphan")
    product_recommendations = db.relationship('ProductRecommendation', backref='user', lazy=True, cascade="all, delete-orphan")
    
    # New relationships
    notes = db.relationship('Note', backref='user', lazy=True, cascade="all, delete-orphan")
    solved_questions = db.relationship('SolvedQuestion', backref='user', lazy=True, cascade="all, delete-orphan")
    study_tasks = db.relationship('StudyTask', backref='user', lazy=True, cascade="all, delete-orphan")
    quizzes = db.relationship('Quiz', backref='user', lazy=True, cascade="all, delete-orphan")
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy=True, cascade="all, delete-orphan")
    revision_items = db.relationship('RevisionItem', backref='user', lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        import hmac
        import hashlib
        import os
        secret = os.getenv('SECRET_KEY', 'studentsync_secret_key_123')
        msg = str(self.id).encode('utf-8')
        signature = hmac.new(secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()
        
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "xp": self.xp,
            "level": self.level,
            "coins": self.coins,
            "streak": self.streak,
            "last_active_date": self.last_active_date,
            "firebase_uid": self.firebase_uid,
            "profile_photo": self.profile_photo,
            "created_at": self.created_at,
            "plan": self.plan,
            "camera_solver_daily_count": self.camera_solver_daily_count,
            "camera_solver_last_used_date": self.camera_solver_last_used_date,
            "auth_signature": signature
        }


class DailyEntry(db.Model):
    __tablename__ = 'daily_entries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD format
    
    # Sleep
    sleep_hours = db.Column(db.Float, default=0.0)
    sleep_bedtime = db.Column(db.String(5), default="22:00")
    sleep_wakeup = db.Column(db.String(5), default="06:00")
    
    # Diet & Water
    meals = db.Column(db.Text, default="")
    water_intake = db.Column(db.Float, default=0.0) # In liters
    
    # Physical
    exercise_mins = db.Column(db.Integer, default=0)
    mood = db.Column(db.String(20), default="😐") # Emoji representation
    stress_level = db.Column(db.Integer, default=3) # 1 (Low) to 5 (High)
    
    # Productivity & Habits
    study_hours = db.Column(db.Float, default=0.0)
    coding_hours = db.Column(db.Float, default=0.0)
    screen_time = db.Column(db.Float, default=0.0)
    reading_mins = db.Column(db.Integer, default=0)
    meditation_mins = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.String(20))

    # Composite unique constraint on user_id and date
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='_user_date_uc'),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date,
            "sleep_hours": self.sleep_hours,
            "sleep_bedtime": self.sleep_bedtime,
            "sleep_wakeup": self.sleep_wakeup,
            "meals": self.meals,
            "water_intake": self.water_intake,
            "exercise_mins": self.exercise_mins,
            "mood": self.mood,
            "stress_level": self.stress_level,
            "study_hours": self.study_hours,
            "coding_hours": self.coding_hours,
            "screen_time": self.screen_time,
            "reading_mins": self.reading_mins,
            "meditation_mins": self.meditation_mins,
            "created_at": self.created_at
        }


class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    total_classes = db.Column(db.Integer, default=0)
    attended_classes = db.Column(db.Integer, default=0)

    def to_dict(self):
        percentage = 0.0
        if self.total_classes > 0:
            percentage = round((self.attended_classes / self.total_classes) * 100, 2)
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject": self.subject,
            "total_classes": self.total_classes,
            "attended_classes": self.attended_classes,
            "percentage": percentage
        }


class Assignment(db.Model):
    __tablename__ = 'assignments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    due_date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    priority = db.Column(db.String(20), default="Medium") # Low, Medium, High
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "due_date": self.due_date,
            "priority": self.priority,
            "completed": self.completed
        }


class PomodoroSession(db.Model):
    __tablename__ = 'pomodoro_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    duration_mins = db.Column(db.Integer, default=25)
    completed_at = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date,
            "duration_mins": self.duration_mins,
            "completed_at": self.completed_at
        }


class WeeklyReport(db.Model):
    __tablename__ = 'weekly_reports'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    week_start_date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    sleep_score = db.Column(db.Float, default=0.0)
    health_score = db.Column(db.Float, default=0.0)
    productivity_score = db.Column(db.Float, default=0.0)
    study_score = db.Column(db.Float, default=0.0)
    ai_suggestions = db.Column(db.Text, default="")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "week_start_date": self.week_start_date,
            "sleep_score": self.sleep_score,
            "health_score": self.health_score,
            "productivity_score": self.productivity_score,
            "study_score": self.study_score,
            "ai_suggestions": self.ai_suggestions
        }


class ProductRecommendation(db.Model):
    __tablename__ = 'product_recommendations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    estimated_price = db.Column(db.String(50), nullable=False)
    amazon_search = db.Column(db.String(500), nullable=False)
    flipkart_search = db.Column(db.String(500), nullable=False)
    confidence = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.String(20)) # YYYY-MM-DD

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "category": self.category,
            "reason": self.reason,
            "estimated_price": self.estimated_price,
            "amazon_search": self.amazon_search,
            "flipkart_search": self.flipkart_search,
            "confidence": self.confidence,
            "created_at": self.created_at
        }


# --- NEW MODELS ---

class Note(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.String(20)) # YYYY-MM-DD
    updated_at = db.Column(db.String(20)) # YYYY-MM-DD

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "content": self.content,
            "summary": self.summary,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


class SolvedQuestion(db.Model):
    __tablename__ = 'solved_questions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    solution_text = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_text": self.question_text,
            "solution_text": self.solution_text,
            "image_path": self.image_path,
            "created_at": self.created_at
        }


class StudyTask(db.Model):
    __tablename__ = 'study_tasks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    scheduled_date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    duration_mins = db.Column(db.Integer, default=30)
    completed = db.Column(db.Boolean, default=False)
    missed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject": self.subject,
            "title": self.title,
            "scheduled_date": self.scheduled_date,
            "duration_mins": self.duration_mins,
            "completed": self.completed,
            "missed": self.missed
        }


class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    questions_json = db.Column(db.Text, nullable=False) # JSON string representation of questions
    created_at = db.Column(db.String(20))

    def to_dict(self):
        import json
        try:
            qs = json.loads(self.questions_json)
        except Exception:
            qs = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "questions": qs,
            "created_at": self.created_at
        }


class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "quiz_id": self.quiz_id,
            "score": self.score,
            "total": self.total,
            "completed_at": self.completed_at
        }


class RevisionItem(db.Model):
    __tablename__ = 'revision_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    item_type = db.Column(db.String(50), nullable=False) # 'note' or 'question'
    item_id = db.Column(db.Integer, nullable=True) # Corresponding Note ID or SolvedQuestion ID
    box = db.Column(db.Integer, default=1) # Leitner box 1 to 5
    next_revision_date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    last_reviewed = db.Column(db.String(10), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "item_type": self.item_type,
            "item_id": self.item_id,
            "box": self.box,
            "next_revision_date": self.next_revision_date,
            "last_reviewed": self.last_reviewed
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False) # 'study', 'revision', 'assignment', 'motivation'
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "message": self.message,
            "read": self.read,
            "created_at": self.created_at
        }
