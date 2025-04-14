from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, session
import os
import openai
from pymongo import MongoClient
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from bson import ObjectId
from datetime import datetime
import logging
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_squared_error
from scipy.stats import spearmanr
import math

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_folder='static')
app.secret_key = os.getenv('SECRET_KEY', 'default-secret-key')

# MongoDB setup - Choose one approach
# Option 1: Direct MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
db = client['music_recommendation']

# Option 2: Flask-PyMongo
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/music_recommendation")
mongo = PyMongo(app)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Sample songs data (replace with your actual songs)
SAMPLE_SONGS = [
    {"id": "1", "title": "Shape of You", "artist": "Ed Sheeran", "language": "English", "mood": "happy", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
    {"id": "2", "title": "Chaleya", "artist": "Arijit Singh", "language": "Hindi", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
    {"id": "3", "title": "Buttabomma", "artist": "Armaan Malik", "language": "Telugu", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"},
    {"id": "4", "title": "Perfect", "artist": "Ed Sheeran", "language": "English", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"},
    {"id": "5", "title": "Raataan Lambiyan", "artist": "Jubin Nautiyal", "language": "Hindi", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"},
    {"id": "6", "title": "Vachindamma", "artist": "Sid Sriram", "language": "Telugu", "mood": "happy", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"},
    {"id": "7", "title": "Blinding Lights", "artist": "The Weeknd", "language": "English", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"},
    {"id": "8", "title": "Tum Hi Ho", "artist": "Arijit Singh", "language": "Hindi", "mood": "sad", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"},
    {"id": "9", "title": "Samajavaragamana", "artist": "Sid Sriram", "language": "Telugu", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"},
    {"id": "10", "title": "Let Her Go", "artist": "Passenger", "language": "English", "mood": "sad", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"},
    {"id": "11", "title": "Ghungroo", "artist": "Arijit Singh", "language": "Hindi", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3"},
    {"id": "12", "title": "Pilla Raa", "artist": "Anurag Kulkarni", "language": "Telugu", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3"},
    {"id": "13", "title": "Memories", "artist": "Maroon 5", "language": "English", "mood": "sad", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3"},
    {"id": "14", "title": "Bekhayali", "artist": "Sachet Tandon", "language": "Hindi", "mood": "sad", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3"},
    {"id": "15", "title": "Sid Sriram Mashup", "artist": "Sid Sriram", "language": "Telugu", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3"},
    {"id": "16", "title": "Senorita", "artist": "Shawn Mendes", "language": "English", "mood": "happy", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"},
    {"id": "17", "title": "Tera Ban Jaunga", "artist": "Akhil Sachdeva", "language": "Hindi", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3"},
    {"id": "18", "title": "Nee Kannu Neeli Samudram", "artist": "Javed Ali", "language": "Telugu", "mood": "sad", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3"},
    {"id": "19", "title": "Counting Stars", "artist": "OneRepublic", "language": "English", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
    {"id": "20", "title": "Malang", "artist": "Ved Sharma", "language": "Hindi", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
    {"id": "21", "title": "Inkem Inkem Inkem Kaavaale", "artist": "Sid Sriram", "language": "Telugu", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"},
    {"id": "22", "title": "Someone You Loved", "artist": "Lewis Capaldi", "language": "English", "mood": "sad", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"},
    {"id": "23", "title": "Tareefan", "artist": "Badshah", "language": "Hindi", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"},
    {"id": "24", "title": "Samajavaragamana (Remix)", "artist": "Sid Sriram", "language": "Telugu", "mood": "happy", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"},
    {"id": "25", "title": "Love Me Like You Do", "artist": "Ellie Goulding", "language": "English", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"},
    {"id": "26", "title": "Dil Diyan Gallan", "artist": "Atif Aslam", "language": "Hindi", "mood": "romantic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"},
    {"id": "27", "title": "Vennello Aadapilla", "artist": "Anurag Kulkarni", "language": "Telugu", "mood": "sad", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"},
    {"id": "28", "title": "Photograph", "artist": "Ed Sheeran", "language": "English", "mood": "happy", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"},
    {"id": "29", "title": "Nashe Si Chadh Gayi", "artist": "Arijit Singh", "language": "Hindi", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3"},
    {"id": "30", "title": "Ramuloo Ramulaa", "artist": "Anurag Kulkarni", "language": "Telugu", "mood": "energetic", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3"}
]

# Utility function to check login
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "Not logged in"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- AUTHENTICATION ROUTES ---

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400

    email = data['email'].strip().lower()
    password = data['password']
    username = data['username']

    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 400

    user = {
        'username': username,
        'email': email,
        'password': generate_password_hash(password),
        'premium': False,
        'created_at': datetime.utcnow(),
        'stories': [],
        'favorites': []
    }

    db.users.insert_one(user)
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    print('Login data:', data)
    if not data or not all(k in data for k in ['email', 'password']):
        print('Missing required fields')
        return jsonify({'error': 'Missing required fields'}), 400

    email = data['email'].strip().lower()
    password = data['password']
    user = db.users.find_one({'email': email})
    print('User from DB:', user)
    if user and check_password_hash(user['password'], password):
        session['user'] = user['username']
        session['email'] = user['email']
        print('Login successful')
        return jsonify({'message': 'Login successful', 'username': user['username']}), 200
    print('Login failed')
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

# --- SONGS ROUTES ---

@app.route('/api/songs/favorite', methods=['POST'])
@login_required
def add_favorite():
    data = request.get_json()
    if not data or 'song_id' not in data:
        return jsonify({'error': 'No song specified'}), 400
    
    db.users.update_one(
        {'email': session['email']},
        {'$addToSet': {'favorites': data['song_id']}}
    )
    return jsonify({'message': 'Song added to favorites'})

@app.route('/api/songs/favorites', methods=['GET'])
@login_required
def get_favorites():
    user = db.users.find_one({'email': session['email']})
    favorite_song_ids = user.get('favorites', [])
    favorite_songs = [song for song in SAMPLE_SONGS if song['id'] in favorite_song_ids]
    return jsonify({'favorites': favorite_songs})

@app.route('/api/songs/all', methods=['GET'])
def get_all_songs():
    return jsonify({'songs': SAMPLE_SONGS})

@app.route('/api/search', methods=['POST'])
def search():
    data = request.get_json()
    query = data.get('q', '').lower()
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    
    # Simple search implementation
    results = [
        song for song in SAMPLE_SONGS
        if query in song['title'].lower() or 
           query in song['artist'].lower() or 
           query in song['mood'].lower()
    ]
    
    return jsonify({'recommendations': results})

# --- MOODBOT CHAT ---

@app.route('/api/moodbot/chat', methods=['POST'])
def chat_with_moodbot():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    try:
        user_message = data['message']
        # Try to extract mood from the user's message
        mood_keywords = ['happy', 'sad', 'energetic', 'romantic', 'melancholic', 'calm']
        detected_mood = None
        for mood in mood_keywords:
            if mood in user_message.lower():
                detected_mood = mood
                break
        # If mood detected, recommend songs with that mood
        if detected_mood:
            recommended = [song for song in SAMPLE_SONGS if song['mood'].lower() == detected_mood]
            bot_reply = f"I sense you're feeling {detected_mood}. Here are some {detected_mood} songs you might like!"
        else:
            # Fallback to OpenAI for more advanced mood detection and recommendation
            song_list_text = '\n'.join([
                f"{song['title']} by {song['artist']} ({song['language']}, mood: {song['mood']})"
                for song in SAMPLE_SONGS
            ])
            system_prompt = (
                "You are MoodBot, a friendly and empathetic AI music assistant. "
                "Given the user's mood or message, suggest up to 5 songs from the provided list that best fit their mood. "
                "Always reply with a short, empathetic message and mention the recommended songs by title."
            )
            chat_prompt = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User message: {user_message}\nAvailable songs:\n{song_list_text}"}
            ]
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=chat_prompt
            )
            bot_reply = response.choices[0].message['content']
            # Try to extract recommended songs by matching titles in the response
            recommended = []
            for song in SAMPLE_SONGS:
                if song['title'].lower() in bot_reply.lower():
                    recommended.append(song)
        # Limit to 5 recommendations
        recommended = recommended[:5]
        return jsonify({
            'response': bot_reply,
            'recommendations': recommended
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- STORY ENGINE (AI/ML-powered) ---

# Load and preprocess dataset for story engine model
df_songs = None
reg_model = None
encoder = None

def initialize_ml_model():
    global df_songs, reg_model, encoder
    try:
        df_songs = pd.read_csv("top_10000_1950-now.csv")
        df_songs['Album Genres'] = df_songs['Album Genres'].fillna("unknown")
        df_songs['Track Name'] = df_songs['Track Name'].fillna("").astype(str)
        df_songs['year'] = pd.to_datetime(df_songs['Album Release Date'], errors='coerce').dt.year
        df_songs['year'] = df_songs['year'].fillna(df_songs['year'].median())
        if 'Popularity' not in df_songs.columns:
            df_songs['Popularity'] = np.random.randint(0, 101, size=len(df_songs))
        df_encoded = pd.get_dummies(df_songs, columns=['Album Genres'])
        feature_cols = [col for col in df_encoded.columns if col.startswith("Album Genres_")] + ['year']
        X = df_encoded[feature_cols]
        y = df_encoded['Popularity']
        reg_model = LinearRegression()
        reg_model.fit(X, y)
        encoder = OneHotEncoder(sparse_output=False)
        encoder.fit_transform(df_songs[['Album Genres']])
        return True
    except Exception as e:
        logging.error(f"[Story Engine] ML Model Load Error: {e}")
        return False

@app.route('/api/story/generate', methods=['POST'])
def generate_story():
    data = request.get_json()
    songs = data.get('songs', [])
    if not songs or not isinstance(songs, list):
        return jsonify({'error': 'No songs provided'}), 400
    
    # Initialize model if not already done
    if df_songs is None or reg_model is None:
        success = initialize_ml_model()
        if not success:
            return jsonify({'error': 'Failed to initialize ML model'}), 500
    
    # Find song rows in df_songs
    found_songs = df_songs[df_songs['Track Name'].isin(songs)]
    if found_songs.empty:
        return jsonify({'error': 'No matching songs found in dataset'}), 400
    
    # Predict engagement for each song
    song_stories = []
    df_encoded = pd.get_dummies(df_songs, columns=['Album Genres'])
    feature_cols = [col for col in df_encoded.columns if col.startswith("Album Genres_")] + ['year']
    
    for _, row in found_songs.iterrows():
        song_vec = np.zeros(len(feature_cols))
        # Set genre
        for i, col in enumerate(feature_cols):
            if col.startswith("Album Genres_") and col == f"Album Genres_{row['Album Genres']}":
                song_vec[i] = 1
            if col == 'year':
                song_vec[i] = row['year']
        engagement = reg_model.predict([song_vec])[0]
        song_stories.append((row['Track Name'], row['Album Genres'], int(row['year']), engagement))
    
    # Sort by engagement
    song_stories.sort(key=lambda x: -x[3])
    
    # Build story string
    story = "<ol>"
    for i, (title, genre, year, engagement) in enumerate(song_stories):
        story += f"<li><b>{title}</b> ({genre}, {year})<br>Predicted Engagement: <span style='color:purple;'>{engagement:.1f}</span></li>"
    story += "</ol>"
    story += "<div class='mt-2'>Enjoy your personalized musical story powered by AI! 🎶</div>"
    
    return jsonify({'story': story})

# --- WEB ROUTES ---

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/welcome')
def welcome():
    return render_template('welcome.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup_page():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Form validation
        if '@' not in email or '.' not in email:
            return render_template('signup.html', error='Invalid email format')
        if len(password) < 6:
            return render_template('signup.html', error='Password must be at least 6 characters')
        if db.users.find_one({'email': email}):
            return render_template('signup.html', error='Email already registered')
            
        # Create user
        user = {
            'username': username,
            'email': email,
            'password': generate_password_hash(password),
            'premium': False,
            'created_at': datetime.utcnow(),
            'stories': [],
            'favorites': []
        }
        db.users.insert_one(user)
        
        return redirect('/login')
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password = request.form['password']
        user = db.users.find_one({'email': email})
        
        if user and check_password_hash(user['password'], password):
            session['user'] = user['username']
            session['email'] = user['email']
            return redirect('/dashboard')
            
        return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')

@app.route('/premium_login', methods=['GET', 'POST'])
def premium_login():
    # Similar logic, can check for a 'premium' flag in user doc
    return render_template('premium_login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', songs=SAMPLE_SONGS)

# Optional route for consistency with HTML links
@app.route('/dashboard.html')
def dashboard_html():
    return redirect('/dashboard')

if __name__ == '__main__':
    if not os.path.exists('static'):
        os.makedirs('static')
    app.run(debug=True, port=5000)