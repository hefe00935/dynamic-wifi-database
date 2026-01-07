"""
WiFi Map Database Setup Script
This script initializes the SQLite database for the WiFi Map application.
"""

import sqlite3
import os
import sys
from pathlib import Path

# Database path
DB_DIR = Path('data')
DB_PATH = DB_DIR / 'wifi.db'

def create_database():
    """Create the SQLite database and all required tables."""
    
    print("Setting up WiFi Map database...")
    
    # Create data directory if it doesn't exist
    DB_DIR.mkdir(exist_ok=True)
    print(f"Created data directory: {DB_DIR}")
    
    # Connect to database (creates file if it doesn't exist)
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    try:
        # Create wifis table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS wifis (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                name TEXT NOT NULL,
                password TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
                user_id TEXT,
                reported_count INTEGER DEFAULT 0,
                last_reported_at TEXT,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        print("Created 'wifis' table")
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_wifis_status ON wifis(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_wifis_location ON wifis(latitude, longitude)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_wifis_user_id ON wifis(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_wifis_created_at ON wifis(created_at DESC)')
        print("Created indexes")
        
        # Create admin_users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admin_users (
                user_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        print("Created 'admin_users' table")
        
        # Create user_submission_limits table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_submission_limits (
                user_id TEXT PRIMARY KEY,
                submission_count INTEGER DEFAULT 0,
                last_submission_at TEXT,
                reset_at TEXT NOT NULL DEFAULT (datetime('now', '+1 day'))
            )
        ''')
        print("Created 'user_submission_limits' table")
        
        # Create trigger for updated_at
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_wifis_updated_at 
            AFTER UPDATE ON wifis
            FOR EACH ROW
            BEGIN
                UPDATE wifis SET updated_at = datetime('now') WHERE id = NEW.id;
            END
        ''')
        print("Created trigger for updated_at")
        
        # Commit changes
        conn.commit()
        print(f"\nDatabase setup complete!")
        print(f"Database location: {DB_PATH.absolute()}")
        print(f"\nNext steps:")
        print(f"   1. Create a .env.local file with your Mapbox token")
        print(f"   2. Run: npm install")
        print(f"   3. Run: npm run dev")
        print(f"   4. Visit: http://localhost:3000")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

def add_admin_user(user_id: str):
    """Add a user to the admin_users table."""
    if not user_id:
        print("❌ Please provide a user_id")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT OR IGNORE INTO admin_users (user_id) VALUES (?)', (user_id,))
        conn.commit()
        print(f"Added user {user_id} as admin")
    except sqlite3.Error as e:
        print(f"❌ Error adding admin user: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == 'add-admin' and len(sys.argv) > 2:
            create_database()  # Ensure DB exists first
            add_admin_user(sys.argv[2])
        else:
            print("Usage:")
            print("  python setup.py              - Create/initialize database")
            print("  python setup.py add-admin <user_id>  - Add admin user")
    else:
        create_database()
