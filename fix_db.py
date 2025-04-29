import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budget_tracker.settings')
django.setup()

import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Check if 'spent' column exists in finances_budget
cursor.execute("PRAGMA table_info(finances_budget);")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]

# Add missing columns
if 'spent' not in column_names:
    print("Adding 'spent' column to finances_budget table...")
    cursor.execute("ALTER TABLE finances_budget ADD COLUMN spent DECIMAL(10, 2) DEFAULT 0;")

if 'account_id' not in column_names:
    print("Adding 'account_id' column to finances_budget table...")
    cursor.execute("ALTER TABLE finances_budget ADD COLUMN account_id INTEGER REFERENCES finances_account(id);")

if 'duration' not in column_names:
    print("Adding 'duration' column to finances_budget table...")
    cursor.execute("ALTER TABLE finances_budget ADD COLUMN duration VARCHAR(20) DEFAULT '1 month';")

if 'start_date' not in column_names:
    print("Adding 'start_date' column to finances_budget table...")
    cursor.execute("ALTER TABLE finances_budget ADD COLUMN start_date DATE;")

# Check if 'month' column should be renamed to 'end_date'
if 'month' in column_names and 'end_date' not in column_names:
    print("Renaming 'month' column to 'end_date'...")
    # SQLite doesn't support direct column rename, so we create a new table with the right structure
    cursor.execute("""
    CREATE TABLE finances_budget_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount DECIMAL(10, 2) NOT NULL,
        end_date DATE NOT NULL,
        category_id INTEGER NOT NULL REFERENCES finances_category(id),
        user_id INTEGER NOT NULL REFERENCES auth_user(id),
        spent DECIMAL(10, 2) DEFAULT 0,
        account_id INTEGER REFERENCES finances_account(id),
        duration VARCHAR(20) DEFAULT '1 month',
        start_date DATE
    );
    """)
    
    # Copy data from the old table to the new one
    cursor.execute("""
    INSERT INTO finances_budget_new (id, amount, end_date, category_id, user_id, spent, account_id, duration, start_date)
    SELECT id, amount, month, category_id, user_id, 0, NULL, '1 month', month FROM finances_budget;
    """)
    
    # Drop the old table and rename the new one
    cursor.execute("DROP TABLE finances_budget;")
    cursor.execute("ALTER TABLE finances_budget_new RENAME TO finances_budget;")

# Check if we need to add the account field to the transactions table
cursor.execute("PRAGMA table_info(finances_transaction);")
transaction_columns = cursor.fetchall()
transaction_column_names = [column[1] for column in transaction_columns]

if 'account_id' not in transaction_column_names:
    print("Adding 'account_id' column to finances_transaction table...")
    cursor.execute("ALTER TABLE finances_transaction ADD COLUMN account_id INTEGER REFERENCES finances_account(id);")

# Commit changes
conn.commit()
conn.close()

print("Database structure updated successfully!") 