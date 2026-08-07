import os
import sqlite3

def patch_database(app):
    """
    Checks if new columns are present in the SQLite database and adds them if missing.
    Flask-SQLAlchemy db.create_all() creates new tables but does not alter existing tables.
    This simple patcher ensures seamless database migration for local development.
    """
    # Extract the database path from SQLALCHEMY_DATABASE_URI
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if not db_uri.startswith('sqlite:///'):
        print("Patcher: Database is not SQLite, skipping automated patches.")
        return
        
    db_path = db_uri.replace('sqlite:///', '')
    # Resolve relative path if needed
    if not os.path.isabs(db_path):
        # Resolve relative to the app base directory
        base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        db_path = os.path.join(base_dir, db_path)

    print(f"Patcher: Checking database columns at {db_path}...")
    if not os.path.exists(db_path):
        print("Patcher: Database file does not exist yet. It will be created by db.create_all().")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Patch `users` table
        cursor.execute("PRAGMA table_info(users)")
        user_cols = [row[1] for row in cursor.fetchall()]
        
        user_patches = {
            'xp': 'INTEGER DEFAULT 0',
            'level': 'INTEGER DEFAULT 1',
            'coins': 'INTEGER DEFAULT 0',
            'streak': 'INTEGER DEFAULT 0',
            'last_active_date': 'VARCHAR(10)',
            'firebase_uid': 'VARCHAR(100)',
            'profile_photo': 'TEXT',
            'created_at': 'VARCHAR(20)',
            'plan': "VARCHAR(20) DEFAULT 'free'",
            'camera_solver_daily_count': 'INTEGER DEFAULT 0',
            'camera_solver_last_used_date': 'VARCHAR(10)'
        }
        
        for col, col_def in user_patches.items():
            if col not in user_cols:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_def}")
                print(f"Patcher: Added column '{col}' to 'users' table.")

        # 2. Patch `daily_entries` table
        cursor.execute("PRAGMA table_info(daily_entries)")
        entry_cols = [row[1] for row in cursor.fetchall()]
        
        entry_patches = {
            'meditation_mins': 'INTEGER DEFAULT 0',
            'reading_mins': 'INTEGER DEFAULT 0'
        }
        
        for col, col_def in entry_patches.items():
            if col not in entry_cols:
                cursor.execute(f"ALTER TABLE daily_entries ADD COLUMN {col} {col_def}")
                print(f"Patcher: Added column '{col}' to 'daily_entries' table.")
                
        conn.commit()
        conn.close()
        print("Patcher: Database columns checked and patched successfully.")
    except Exception as e:
        print(f"Patcher Warning: Failed to patch database schema: {str(e)}")
