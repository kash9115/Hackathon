from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
# from models import db, Profile
import os
import uuid
import sqlite3
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    profession = db.Column(db.String(50), nullable=False)
    designation = db.Column(db.String(100), nullable=False)
    document_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'profession': self.profession,
            'designation': self.designation,
            'document_path': self.document_path,
            'created_at': self.created_at.isoformat()
        } 

app = Flask(__name__, static_folder='../frontend/build')

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "https://your-production-domain.com"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///profiles.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Initialize database
db.init_app(app)

# Create uploads directory if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    print(os.getcwd())
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
            email TEXT PRIMARY KEY,
            name TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            original_filename TEXT,
            stored_filename TEXT,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (email) REFERENCES users (email)
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
        c.execute('INSERT INTO users (name, email) VALUES (?, ?)',
                 (data['name'], data['email']))
        conn.commit()
        return jsonify({
            'message': 'Profile created successfully',
            'email': data['email'],
            'name': data['name']
        })
    # except sqlite3.IntegrityError:
    #     return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/chat', methods=["POST"])
def chat():
    data = request.json
    print("data", data)
    email = data.get('email')
    message = data.get('message')
    
    # if not email or not message:
    #     return jsonify({'error': 'Email and message are required'}), 400
        
    return jsonify({
        'message': 'Message received',
        'response': 'This is a sample response'
    })

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
    
    # email = request.form.get('email')
    email = "hritikgupta7080@gmail.com"
    # if not email:
    #     return jsonify({'error': 'Email is required'}), 400

    uploaded_files = request.files.getlist('files[]')
    
    if not uploaded_files or all(file.filename == '' for file in uploaded_files):
        return jsonify({'error': 'No selected files'}), 400

    try:
        uploaded_filenames = []
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        
        print("uploaded_files", uploaded_files)
        for file in uploaded_files:
            original_filename = secure_filename(file.filename)
            file_extension = os.path.splitext(original_filename)[1]
            stored_filename = f"{original_filename.rsplit('.', 1)[0]}_{email}{file_extension}"
            
            # Save file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], stored_filename)
            file.save(file_path)
            
            # Save to database
            c.execute('''
                INSERT INTO user_files (email, original_filename, stored_filename)
                VALUES (?, ?, ?)
            ''', (email, original_filename, stored_filename))
            
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
    email = "hritikgupta7080@gmail.com"
    # if not email:
    #     return jsonify({'error': 'Email is required'}), 400
    
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('''
            SELECT original_filename, stored_filename, upload_date
            FROM user_files
            WHERE email = ?
            ORDER BY upload_date DESC
        ''', (email,))
        
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 