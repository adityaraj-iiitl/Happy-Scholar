from flask import Blueprint, request, jsonify
from database.db import db
from models import Note, User
from utils.gemini import call_gemini
from utils.doc_parser import extract_text_from_file
import json
import tempfile
import os
from datetime import datetime

notes_bp = Blueprint('notes', __name__)

def reward_note_xp(user_id):
    """
    Rewards the user 15 XP for note generation activity.
    """
    try:
        user = User.query.get(user_id)
        if user:
            user.xp += 15
            new_level = (user.xp // 100) + 1
            if new_level > user.level:
                user.level = new_level
                user.coins += 10
            user.coins += 1
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to reward XP: {str(e)}")


@notes_bp.route('', methods=['GET'])
@notes_bp.route('/', methods=['GET'])
def get_notes():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        notes = Note.query.filter_by(user_id=user_id).order_by(Note.updated_at.desc()).all()
        return jsonify([n.to_dict() for n in notes]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@notes_bp.route('/generate', methods=['POST'])
def generate_notes_from_topic():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    topic = data.get('topic')
    detail_level = data.get('detail_level', 'detailed') # short, detailed, bullet
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
        
    prompt = f"""
    You are an expert AI academic tutor. Generate complete, highly educational study notes on the topic: "{topic}".
    
    The notes should be formatted according to the detail level: "{detail_level}".
    - If "short", provide a concise, high-impact summary of key concepts.
    - If "detailed", provide an exhaustive explanation with definitions, bullet points, code examples (if relevant), and clear subheadings.
    - If "bullet", write exclusively in structured bullet points, starting with high-level concepts and drilling down to details.
    
    Return your response strictly as a JSON object with these exact keys:
    - "title": A clean, relevant title for these notes (e.g. "Understanding Neural Networks")
    - "content": The generated notes formatted beautifully in clean Markdown. Include subheadings (using ##), bold text, bullet lists, and tables or code blocks if appropriate.
    - "summary": A quick 2-3 sentence overview highlighting the core takeaways.
    
    Return only the JSON object. Do not include markdown code block syntax (like ```json).
    """
    
    res_text = call_gemini(prompt, response_mime_type="application/json")
    if not res_text:
        return jsonify({"error": "Failed to generate notes using Gemini API"}), 500
        
    try:
        cleaned_text = res_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        note_data = json.loads(cleaned_text.strip())
        today = datetime.now().strftime("%Y-%m-%d")
        
        new_note = Note(
            user_id=user_id,
            title=note_data.get('title', f"Notes: {topic}"),
            content=note_data.get('content', ''),
            summary=note_data.get('summary', ''),
            created_at=today,
            updated_at=today
        )
        db.session.add(new_note)
        db.session.commit()
        
        # Reward XP
        reward_note_xp(user_id)
        
        return jsonify(new_note.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to process AI response: {str(e)}"}), 500


@notes_bp.route('/upload', methods=['POST'])
def generate_notes_from_upload():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    detail_level = request.form.get('detail_level', 'detailed')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    filename = file.filename
    _, ext = os.path.splitext(filename)
    
    # Save to a temporary file
    try:
        temp_fd, temp_path = tempfile.mkstemp(suffix=ext)
        os.close(temp_fd)
        file.save(temp_path)
        
        # Extract text from document
        extracted_text = extract_text_from_file(temp_path, ext)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        if extracted_text.startswith("Error"):
            return jsonify({"error": extracted_text}), 400
            
        if not extracted_text.strip():
            return jsonify({"error": "No text could be extracted from this document."}), 400
            
        # Limit extracted text to prevent hitting context limits (e.g. ~15k chars is plenty for note summaries)
        truncated_text = extracted_text[:15000]
        
        prompt = f"""
        You are an expert AI study helper. I will give you the extracted text from a student's study document ({filename}).
        Generate a structured, easy-to-read set of notes based on the document content.
        
        Document Content (truncated):
        {truncated_text}
        
        The notes should be formatted according to the detail level: "{detail_level}".
        - If "short", summarize the document in a high-impact, brief style.
        - If "detailed", create comprehensive study notes covering all primary topics, definitions, subtopics, and details from the document text.
        - If "bullet", extract the core facts and details in nested bullet points.
        
        Return your response strictly as a JSON object with these exact keys:
        - "title": A clean, relevant title for these notes (default to a title matching the document content)
        - "content": The notes formatted in Markdown. Use headings, lists, bold text, and code blocks for readability.
        - "summary": A quick 2-3 sentence overview highlighting the core takeaways.
        
        Return only the JSON object. Do not include markdown code block syntax (like ```json).
        """
        
        res_text = call_gemini(prompt, response_mime_type="application/json")
        if not res_text:
            return jsonify({"error": "Failed to generate notes from upload using Gemini"}), 500
            
        cleaned_text = res_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        note_data = json.loads(cleaned_text.strip())
        today = datetime.now().strftime("%Y-%m-%d")
        
        new_note = Note(
            user_id=user_id,
            title=note_data.get('title', f"Notes from {filename}"),
            content=note_data.get('content', ''),
            summary=note_data.get('summary', ''),
            created_at=today,
            updated_at=today
        )
        db.session.add(new_note)
        db.session.commit()
        
        # Reward XP
        reward_note_xp(user_id)
        
        return jsonify(new_note.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to generate notes: {str(e)}"}), 500


@notes_bp.route('/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404
            
        data = request.get_json() or {}
        note.title = data.get('title', note.title)
        note.content = data.get('content', note.content)
        note.summary = data.get('summary', note.summary)
        note.updated_at = datetime.now().strftime("%Y-%m-%d")
        
        db.session.commit()
        return jsonify(note.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@notes_bp.route('/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404
            
        db.session.delete(note)
        db.session.commit()
        return jsonify({"message": "Note deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
