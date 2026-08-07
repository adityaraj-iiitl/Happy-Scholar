from flask import Blueprint, request, jsonify
from database.db import db
from models import SolvedQuestion, User
from utils.gemini import get_api_key
import requests
import json
import base64
import os
from datetime import datetime

camera_bp = Blueprint('camera', __name__)

def reward_solver_xp(user_id):
    """
    Rewards the user 20 XP for solving a question using AI camera solver.
    """
    try:
        user = User.query.get(user_id)
        if user:
            user.xp += 20
            new_level = (user.xp // 100) + 1
            if new_level > user.level:
                user.level = new_level
                user.coins += 10
            user.coins += 2
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to reward XP: {str(e)}")


def call_gemini_multimodal(image_base64, mime_type, prompt):
    """
    Calls Gemini 2.5 Flash model with a multimodal image input and a text prompt.
    """
    api_key = get_api_key()
    if not api_key:
        print("Warning: Gemini API Key is missing.")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            res_data = response.json()
            text = res_data['candidates'][0]['content']['parts'][0]['text']
            return text
        else:
            print(f"Gemini API error ({response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"Failed to connect to Gemini API: {str(e)}")
        return None


@camera_bp.route('', methods=['GET'])
@camera_bp.route('/', methods=['GET'])
def get_solved_questions():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        questions = SolvedQuestion.query.filter_by(user_id=user_id).order_by(SolvedQuestion.created_at.desc()).all()
        return jsonify([q.to_dict() for q in questions]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@camera_bp.route('/solve', methods=['POST'])
def solve_question():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    image_data_url = data.get('image') # Base64 data url (e.g. data:image/png;base64,iVBORw...)
    custom_question = data.get('question_text') # Optional fallback question text
    
    if not image_data_url:
        return jsonify({"error": "Image data is required"}), 400
        
    try:
        # Extract base64 and mime type from data URL
        # Format: "data:image/png;base64,iVBORw..."
        header, base64_data = image_data_url.split(',', 1)
        mime_type = header.split(';', 1)[0].split(':', 1)[1]
    except Exception:
        return jsonify({"error": "Invalid image URL format"}), 400
        
    prompt = """
    You are an expert academic tutor. Inspect this image containing a school or college question (it could be a math equation, diagram, physics problem, computer code, or question text).
    
    1. Perform OCR to extract the question text accurately.
    2. Solve the question. Provide a detailed, step-by-step explanation of the solution.
    3. If it is a math question, explain all equations and calculations clearly.
    
    Return your response strictly as a JSON object with these exact keys:
    - "question_text": The raw text of the question extracted from the image.
    - "solution_text": The step-by-step solution formatted beautifully in markdown. Include subheadings, lists, bold keywords, and LaTeX formulas block-rendered where helpful (e.g., $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).
    
    Do not include any extra text or code block fences outside the JSON. Return only the JSON object.
    """
    
    res_text = call_gemini_multimodal(base64_data, mime_type, prompt)
    if not res_text:
        return jsonify({"error": "Failed to process image with Gemini API"}), 500
        
    try:
        cleaned_text = res_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        solved_data = json.loads(cleaned_text.strip())
        
        today = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        new_q = SolvedQuestion(
            user_id=user_id,
            question_text=solved_data.get('question_text', 'Captured Question'),
            solution_text=solved_data.get('solution_text', ''),
            image_path=image_data_url[:2000], # Keep a snippet or link for display reference
            created_at=today
        )
        
        db.session.add(new_q)
        db.session.commit()
        
        # Reward XP
        reward_solver_xp(user_id)
        
        return jsonify(new_q.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to solve question: {str(e)}"}), 500


@camera_bp.route('/<int:q_id>', methods=['DELETE'])
def delete_solved_question(q_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        q = SolvedQuestion.query.filter_by(id=q_id, user_id=user_id).first()
        if not q:
            return jsonify({"error": "Question not found"}), 404
            
        db.session.delete(q)
        db.session.commit()
        return jsonify({"message": "Solved question deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
