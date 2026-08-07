from flask import Blueprint, request, jsonify
from database.db import db
from models import Assignment

assignments_bp = Blueprint('assignments', __name__)

@assignments_bp.route('', methods=['GET'])
@assignments_bp.route('/', methods=['GET'])
def get_assignments():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        assignments = Assignment.query.filter_by(user_id=user_id).all()
        return jsonify({"assignments": [a.to_dict() for a in assignments]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@assignments_bp.route('', methods=['POST'])
@assignments_bp.route('/', methods=['POST'])
def add_assignment():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    title = data.get('title')
    due_date = data.get('due_date')
    priority = data.get('priority', 'Medium')

    if not title or not due_date:
        return jsonify({"error": "Title and due date are required"}), 400

    try:
        new_assignment = Assignment(user_id=user_id, title=title, due_date=due_date, priority=priority, completed=False)
        db.session.add(new_assignment)
        db.session.commit()
        return jsonify({"message": "Assignment created successfully", "assignment": new_assignment.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@assignments_bp.route('/<int:assignment_id>', methods=['PUT'])
def update_assignment(assignment_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    assignment = Assignment.query.filter_by(id=assignment_id, user_id=user_id).first()
    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    data = request.get_json() or {}
    
    if 'completed' in data:
        assignment.completed = bool(data['completed'])
    if 'title' in data:
        assignment.title = data['title']
    if 'due_date' in data:
        assignment.due_date = data['due_date']
    if 'priority' in data:
        assignment.priority = data['priority']

    try:
        db.session.commit()
        return jsonify({"message": "Assignment updated successfully", "assignment": assignment.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@assignments_bp.route('/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    assignment = Assignment.query.filter_by(id=assignment_id, user_id=user_id).first()
    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    try:
        db.session.delete(assignment)
        db.session.commit()
        return jsonify({"message": "Assignment deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
