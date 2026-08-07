from flask import Blueprint, request, jsonify
from database.db import db
from models import RevisionItem, User
from datetime import datetime, timedelta

revision_bp = Blueprint('revision', __name__)

# Leitner system intervals (in days)
BOX_INTERVALS = {
    1: 1,   # Box 1: review every day
    2: 3,   # Box 2: review every 3 days
    3: 7,   # Box 3: review every 7 days
    4: 14,  # Box 4: review every 14 days
    5: 30   # Box 5: review every 30 days
}

def reward_revision_xp(user_id):
    """
    Rewards the user 10 XP for completing a revision card.
    """
    try:
        user = User.query.get(user_id)
        if user:
            user.xp += 10
            new_level = (user.xp // 100) + 1
            if new_level > user.level:
                user.level = new_level
                user.coins += 10
            user.coins += 1
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to reward XP: {str(e)}")


@revision_bp.route('', methods=['GET'])
@revision_bp.route('/', methods=['GET'])
def get_revision_status():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        # Fetch all items
        all_items = RevisionItem.query.filter_by(user_id=user_id).all()
        
        # Filter due items (scheduled today or in the past)
        due_items = [item.to_dict() for item in all_items if item.next_revision_date <= today_str]
        
        # Calculate statistics
        box_stats = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for item in all_items:
            box_stats[item.box] = box_stats.get(item.box, 0) + 1
            
        return jsonify({
            "due_items": due_items,
            "all_items": [item.to_dict() for item in all_items],
            "box_stats": box_stats
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@revision_bp.route('/add', methods=['POST'])
def add_revision_item():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    item_type = data.get('item_type') # 'note' or 'question'
    item_id = data.get('item_id') # Note/Question primary key ID
    title = data.get('title')
    
    if not item_type or not item_id or not title:
        return jsonify({"error": "Item type, ID, and title are required"}), 400
        
    try:
        # Check if already exists in revision queue
        existing = RevisionItem.query.filter_by(
            user_id=user_id,
            item_type=item_type,
            item_id=item_id
        ).first()
        
        if existing:
            return jsonify({"message": "Item is already in revision queue", "item": existing.to_dict()}), 200
            
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        new_item = RevisionItem(
            user_id=user_id,
            title=title,
            item_type=item_type,
            item_id=item_id,
            box=1,
            next_revision_date=today_str,
            last_reviewed=None
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@revision_bp.route('/review', methods=['POST'])
def record_review():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    item_id = data.get('id') # RevisionItem ID
    remembered = data.get('remembered', True) # True if correct, False if forgotten
    
    if item_id is None:
        return jsonify({"error": "Revision item ID is required"}), 400
        
    try:
        item = RevisionItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not item:
            return jsonify({"error": "Revision item not found"}), 404
            
        today_str = datetime.now().strftime("%Y-%m-%d")
        today_dt = datetime.now()
        
        # Leitner box progression
        if remembered:
            item.box = min(5, item.box + 1)
        else:
            item.box = 1 # Reset to Box 1 if forgotten
            
        # Compute next revision date based on box level
        interval = BOX_INTERVALS[item.box]
        next_date_dt = today_dt + timedelta(days=interval)
        
        item.next_revision_date = next_date_dt.strftime("%Y-%m-%d")
        item.last_reviewed = today_str
        
        db.session.commit()
        
        # Reward XP
        reward_revision_xp(user_id)
        
        return jsonify({
            "message": "Review recorded successfully",
            "item": item.to_dict(),
            "next_interval_days": interval
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
