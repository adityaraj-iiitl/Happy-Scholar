from flask import Blueprint, request, jsonify
from database.db import db
from models import Quiz, QuizAttempt, Note, User
from utils.gemini import call_gemini
import json
from datetime import datetime

quiz_bp = Blueprint('quiz', __name__)

def reward_quiz_xp(user_id, correct_count):
    """
    Rewards baseline 30 XP for completing a quiz, plus 5 XP for each correct answer.
    """
    try:
        user = User.query.get(user_id)
        if user:
            xp_reward = 30 + (correct_count * 5)
            user.xp += xp_reward
            new_level = (user.xp // 100) + 1
            if new_level > user.level:
                user.level = new_level
                user.coins += 10
            user.coins += max(1, xp_reward // 10)
            db.session.commit()
            return xp_reward
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to reward XP: {str(e)}")
    return 0


@quiz_bp.route('', methods=['GET'])
@quiz_bp.route('/', methods=['GET'])
def get_quiz_history():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        attempts = QuizAttempt.query.filter_by(user_id=user_id).order_by(QuizAttempt.completed_at.desc()).all()
        
        # Hydrate attempt dictionary with quiz title
        results = []
        for att in attempts:
            att_dict = att.to_dict()
            quiz = Quiz.query.get(att.quiz_id)
            att_dict['quiz_title'] = quiz.title if quiz else "Deleted Quiz"
            results.append(att_dict)
            
        return jsonify({
            "attempts": results,
            "quizzes": [q.to_dict() for q in Quiz.query.filter_by(user_id=user_id).all()]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@quiz_bp.route('/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first()
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404
        return jsonify(quiz.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@quiz_bp.route('/generate', methods=['POST'])
def generate_quiz():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    source_type = data.get('source_type', 'topic') # 'note', 'topic', 'text'
    source_id = data.get('source_id') # Note ID if source_type == 'note'
    topic = data.get('topic') # Custom topic text
    raw_text = data.get('raw_text') # Raw document text
    quiz_type = data.get('quiz_type', 'mcq') # 'mcq', 'tf', 'fill'
    num_questions = int(data.get('num_questions', 5))
    
    quiz_content = ""
    quiz_source_title = ""
    
    # 1. Fetch content from source
    if source_type == 'note':
        if not source_id:
            return jsonify({"error": "Note ID is required"}), 400
        note = Note.query.filter_by(id=source_id, user_id=user_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404
        quiz_content = note.content
        quiz_source_title = note.title
    elif source_type == 'text':
        if not raw_text:
            return jsonify({"error": "Raw text is required"}), 400
        quiz_content = raw_text
        quiz_source_title = "Uploaded Document"
    else: # topic
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        quiz_content = f"General knowledge and concepts about: {topic}"
        quiz_source_title = topic
        
    prompt = f"""
    You are an expert academic examiner. Generate a quiz with exactly {num_questions} questions of type: "{quiz_type}".
    
    Subject Content/Context:
    {quiz_content[:15000]}
    
    Follow these strict formatting guidelines:
    - If type is "mcq", create multiple choice questions with exactly 4 options. The correct answer must be the exact string of the correct option.
    - If type is "tf", create True/False statements. Options must be exactly ["True", "False"]. The correct answer must be "True" or "False".
    - If type is "fill", create fill-in-the-blank questions (use _____ inside the question text). The correct answer must be the exact string of the missing word. Options must be empty.
    
    Return your response strictly as a JSON object with these exact keys:
    - "title": A clean title for this quiz (e.g. "{quiz_source_title} Quiz")
    - "questions": An array of question objects, each with:
      - "question": The question text
      - "options": An array of strings representing options (or empty array for fill-in-the-blank)
      - "correct_answer": The exact string of the correct answer
      - "explanation": A detailed, clear explanation showing why this answer is correct and educating the student.
      
    Return only the JSON object. Do not include markdown code block syntax (like ```json).
    """
    
    res_text = call_gemini(prompt, response_mime_type="application/json")
    
    quiz_data = None
    if res_text:
        try:
            cleaned_text = res_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            quiz_data = json.loads(cleaned_text.strip())
        except Exception as e:
            print(f"Warning: Failed to parse generated quiz JSON: {str(e)}")
            quiz_data = None

    if not quiz_data:
        print("Patcher/Quiz: Gemini failed or returned invalid JSON. Using local fallback quiz generator.")
        source_name = quiz_source_title or topic or "selected material"
        try:
            # Generate fallback questions based on quiz_type
            questions = []
            if quiz_type == 'tf':
                questions = [
                    {
                        "question": f"Consistency in daily study is more effective than cramming for understanding {source_name}.",
                        "options": ["True", "False"],
                        "correct_answer": "True",
                        "explanation": f"Distributed learning is proven to boost long-term retention and reduce exam anxiety when studying {source_name}."
                    },
                    {
                        "question": f"Practical application and problem-solving are unnecessary for mastering concepts related to {source_name}.",
                        "options": ["True", "False"],
                        "correct_answer": "False",
                        "explanation": f"Hands-on exercises and active application are crucial for deep conceptual mastery of {source_name}."
                    },
                    {
                        "question": f"Taking regular short breaks (e.g. Pomodoro technique) improves overall focus and learning efficiency.",
                        "options": ["True", "False"],
                        "correct_answer": "True",
                        "explanation": "Short breaks help prevent cognitive fatigue and restore focus."
                    }
                ]
            elif quiz_type == 'fill':
                questions = [
                    {
                        "question": f"To retain details about {source_name} over a long period, students should use spaced _____.",
                        "options": [],
                        "correct_answer": "repetition",
                        "explanation": "Spaced repetition involves reviewing material at increasing intervals to improve retrieval strength."
                    },
                    {
                        "question": f"The process of actively testing your memory rather than just reading is called active _____.",
                        "options": [],
                        "correct_answer": "recall",
                        "explanation": "Active recall forces the brain to retrieve information from memory, consolidating neural pathways."
                    }
                ]
            else: # MCQ
                questions = [
                    {
                        "question": f"What is the primary goal when studying the topic of {source_name}?",
                        "options": [
                            "To understand the core concepts and principles",
                            "To memorize facts without understanding",
                            "To avoid practicing any related problems",
                            "To ignore any real-world applications"
                        ],
                        "correct_answer": "To understand the core concepts and principles",
                        "explanation": f"When exploring {source_name}, grasping the fundamental concepts provides a foundation for solving complex problems and applying knowledge practically."
                    },
                    {
                        "question": f"Which of the following is considered a best practice for learning {source_name}?",
                        "options": [
                            "Spaced repetition and active recall",
                            "Cramming the night before the exam",
                            "Reading the textbook passively multiple times",
                            "Avoiding asking questions or looking up resources"
                        ],
                        "correct_answer": "Spaced repetition and active recall",
                        "explanation": f"Active learning techniques like active recall and spaced repetition improve long-term retention of {source_name}."
                    },
                    {
                        "question": f"What role does practical application play in mastering {source_name}?",
                        "options": [
                            "It helps bridge the gap between theory and real-world scenarios",
                            "It is completely useless and should be skipped",
                            "It only serves to confuse the student",
                            "It is only relevant for advanced researchers"
                        ],
                        "correct_answer": "It helps bridge the gap between theory and real-world scenarios",
                        "explanation": f"Applying theoretical concepts of {source_name} to concrete examples or projects consolidates memory and develops practical problem-solving skills."
                    }
                ]
            
            quiz_data = {
                "title": f"{source_name} Quiz",
                "questions": questions
            }
        except Exception as e:
            return jsonify({"error": f"Fallback quiz generation failed: {str(e)}"}), 500
        
    try:
        # Save Quiz
        new_quiz = Quiz(
            user_id=user_id,
            title=quiz_data.get('title', f"{quiz_source_title} Quiz"),
            questions_json=json.dumps(quiz_data.get('questions', [])),
            created_at=datetime.now().strftime("%Y-%m-%d")
        )
        
        db.session.add(new_quiz)
        db.session.commit()
        
        return jsonify(new_quiz.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save generated quiz: {str(e)}"}), 500


@quiz_bp.route('/submit', methods=['POST'])
def submit_quiz():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    quiz_id = data.get('quiz_id')
    score = data.get('score')
    total = data.get('total')
    
    if quiz_id is None or score is None or total is None:
        return jsonify({"error": "Quiz ID, score, and total are required"}), 400
        
    try:
        new_attempt = QuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            score=int(score),
            total=int(total),
            completed_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.session.add(new_attempt)
        db.session.commit()
        
        # Reward XP
        xp_earned = reward_quiz_xp(user_id, int(score))
        
        return jsonify({
            "message": "Quiz attempt logged successfully",
            "attempt": new_attempt.to_dict(),
            "xp_earned": xp_earned
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
