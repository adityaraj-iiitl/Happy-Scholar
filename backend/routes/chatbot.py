from flask import Blueprint, request, jsonify
from utils.gemini import call_gemini
import json

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/message', methods=['POST'])
def send_message():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    message = data.get('message')
    history = data.get('history', []) # List of chat messages: [{"sender": "user", "text": "..."}, {"sender": "ai", "text": "..."}]
    pdf_context = data.get('pdf_context') # Extracted text of uploaded PDF, if any
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    # Format the conversational context from history
    context_str = ""
    if history:
        context_str = "Conversation history:\n"
        for msg in history[-8:]: # Pass the last 8 messages for context
            role = "Student" if msg.get('sender') == 'user' else "AI Assistant"
            context_str += f"{role}: {msg.get('text')}\n"
        context_str += "\n"
        
    pdf_instruction = ""
    if pdf_context:
        # Truncate context to ~12k characters to avoid token limit issues
        truncated_context = pdf_context[:12000]
        pdf_instruction = f"""
        The student has uploaded a PDF document. Use the extracted PDF content below to answer the student's question. If the answer cannot be found in the text, you may use your general knowledge, but state that clearly.
        
        PDF Content Context:
        {truncated_context}
        
        """
        
    prompt = f"""
    You are an expert, encouraging AI study chatbot designed for college students. 
    Your job is to answer academic questions, explain complex topics, solve equations, and help with coding tasks.
    
    Format your responses:
    - Use clean Markdown tags (subheadings, lists, bold text).
    - If explaining code, write it inside standard Markdown code blocks with language indicators (e.g. ```python).
    - If displaying mathematical formulas, use LaTeX formatting inside dollar signs (e.g., $E=mc^2$ or $$x = \\frac{{-b \\pm \\sqrt{{b^2 - 4ac}}}}{{2a}}$$).
    
    {pdf_instruction}
    {context_str}
    Student's question: "{message}"
    
    AI Response:
    """
    
    res_text = call_gemini(prompt)
    if not res_text:
        return jsonify({"error": "Failed to generate AI response from chatbot"}), 500
        
    return jsonify({
        "message": res_text
    }), 200


@chatbot_bp.route('/parse-pdf', methods=['POST'])
def parse_chatbot_pdf():
    """
    Utility endpoint to extract text from a PDF upload for the Chatbot sidebar context.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    from utils.doc_parser import parse_pdf
    import tempfile
    import os
    
    try:
        temp_fd, temp_path = tempfile.mkstemp(suffix=".pdf")
        os.close(temp_fd)
        file.save(temp_path)
        
        extracted_text = parse_pdf(temp_path)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        if extracted_text.startswith("Error"):
            return jsonify({"error": extracted_text}), 400
            
        return jsonify({
            "text": extracted_text,
            "filename": file.filename
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to extract PDF text: {str(e)}"}), 500
