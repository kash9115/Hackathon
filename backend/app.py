from flask import Flask, send_from_directory, request, jsonify, session
from flask_cors import CORS
from models import db, Profile
import os
import uuid
from datetime import timedelta
import sqlite3
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='../frontend/build')
CORS(app, supports_credentials=True)

# Configure SQLite database and session
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///profiles.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this to a secure secret key
app.config['SESSION_COOKIE_SECURE'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Initialize database
db.init_app(app)

# Create uploads directory if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Create database tables
with app.app_context():
    db.create_all()

# Database setup
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            profession TEXT NOT NULL,
            designation TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            stored_filename TEXT NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (email) REFERENCES users(email)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/designations/<profession>')
def get_designations(profession):
    designations = {
        'Employee': [
            'Data Scientist',
            'Software Engineer',
            'Product Manager',
            'Business Analyst',
            'DevOps Engineer'
        ],
        'Student': [
            'High School Student',
            'Undergraduate Student',
            'Post Graduate Student',
            'PhD Student',
            'Research Scholar'
        ]
    }
    return jsonify(designations.get(profession, []))

@app.route('/api/check-email', methods=['POST'])
def check_email():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    
    try:
        c.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        exists = bool(user)
        return jsonify({'exists': exists})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/profile', methods=['POST'])
def create_profile():
    data = request.json
    required_fields = ['name', 'email', 'profession', 'designation']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    
    try:
        c.execute('''
            INSERT INTO users (name, email, profession, designation)
            VALUES (?, ?, ?, ?)
        ''', (data['name'], data['email'], data['profession'], data['designation']))
        conn.commit()
        return jsonify({'message': 'Profile created successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/check-session')
def check_session():
    if 'user_email' in session:
        return jsonify({
            'email': session['user_email'],
            'user_id': session['user_id']
        })
    return jsonify({'error': 'No active session'}), 401

@app.route('/api/logout')
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/chat', methods=["POST"])
def chat():
    if 'user_email' in session:
        print("session", session)
        return jsonify({
            'message': 'Chat session active',
            'user_email': session['user_email']
        })
    return jsonify({'error': 'No active session'}), 401

@app.route('/api/clear-database', methods=['POST'])
def clear_database():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    
    try:
        # Get all stored filenames before deleting records
        c.execute('SELECT stored_filename FROM user_files')
        stored_files = c.fetchall()
        
        # Delete files from uploads directory
        for (stored_filename,) in stored_files:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], stored_filename)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error deleting file {stored_filename}: {str(e)}")
        
        # Clear all tables
        c.execute('DELETE FROM user_files')
        c.execute('DELETE FROM users')
        conn.commit()
        
        return jsonify({'message': 'Database and uploaded files cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    if 'user_email' not in session:
        return jsonify({'error': 'No active session'}), 401

    user_email = session['user_email']
    uploaded_files = request.files.getlist('files[]')
    
    if not uploaded_files or all(file.filename == '' for file in uploaded_files):
        return jsonify({'error': 'No selected files'}), 400

    try:
        uploaded_filenames = []
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        
        for file in uploaded_files:
            original_filename = secure_filename(file.filename)
            file_extension = os.path.splitext(original_filename)[1]
            stored_filename = f"{original_filename.rsplit('.', 1)[0]}_{user_email}{file_extension}"
            
            # Save file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], stored_filename)
            file.save(file_path)
            
            # Save to database
            c.execute('''
                INSERT INTO user_files (email, original_filename, stored_filename)
                VALUES (?, ?, ?)
            ''', (user_email, original_filename, stored_filename))
            
            uploaded_filenames.append(original_filename)
        
        conn.commit()
        return jsonify({
            'message': 'Files uploaded successfully',
            'filenames': uploaded_filenames
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/user-files', methods=['GET'])
def get_user_files():
    if 'user_email' not in session:
        return jsonify({'error': 'No active session'}), 401
    
    user_email = session['user_email']
    
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('''
            SELECT original_filename, stored_filename, upload_date
            FROM user_files
            WHERE email = ?
            ORDER BY upload_date DESC
        ''', (user_email,))
        
        files = [{
            'originalName': row[0],
            'storedName': row[1],
            'uploadDate': row[2]
        } for row in c.fetchall()]
        
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, debug=True) 