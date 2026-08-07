from flask import Blueprint, request, jsonify
from database.db import db
from models import Attendance

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('', methods=['GET'])
@attendance_bp.route('/', methods=['GET'])
def get_attendance():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        records = Attendance.query.filter_by(user_id=user_id).all()
        return jsonify({"attendance": [r.to_dict() for r in records]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@attendance_bp.route('', methods=['POST'])
@attendance_bp.route('/', methods=['POST'])
def add_attendance():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    subject = data.get('subject')
    total = int(data.get('total_classes', 0))
    attended = int(data.get('attended_classes', 0))

    if not subject:
        return jsonify({"error": "Subject name is required"}), 400

    try:
        new_record = Attendance(user_id=user_id, subject=subject, total_classes=total, attended_classes=attended)
        db.session.add(new_record)
        db.session.commit()
        return jsonify({"message": "Subject added successfully", "record": new_record.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@attendance_bp.route('/<int:record_id>', methods=['PUT'])
def update_attendance(record_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    record = Attendance.query.filter_by(id=record_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "Record not found"}), 404

    data = request.get_json() or {}
    
    # We can either edit direct values or perform an action like "increment_attended" / "increment_missed"
    action = data.get('action')
    if action == 'attend':
        record.total_classes += 1
        record.attended_classes += 1
    elif action == 'miss':
        record.total_classes += 1
    else:
        # Direct edit
        if 'subject' in data:
            record.subject = data['subject']
        if 'total_classes' in data:
            record.total_classes = int(data['total_classes'])
        if 'attended_classes' in data:
            record.attended_classes = int(data['attended_classes'])

    try:
        db.session.commit()
        return jsonify({"message": "Attendance updated successfully", "record": record.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@attendance_bp.route('/<int:record_id>', methods=['DELETE'])
def delete_attendance(record_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    record = Attendance.query.filter_by(id=record_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "Record not found"}), 404

    try:
        db.session.delete(record)
        db.session.commit()
        return jsonify({"message": "Subject deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
