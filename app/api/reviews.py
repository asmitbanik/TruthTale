from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_pymongo import PyMongo  # Import PyMongo
import requests
import time  
from functools import wraps
from keras.models import load_model
import numpy as np
import os
from dotenv import load_dotenv  # Import dotenv to load environment variables
import logging
from ml.preprocessing import clean_text  # Import the clean_text function
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import datetime
import threading

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Load the JWT secret key from an environment variable
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_default_secret_key')  # Change this to a strong secret
jwt = JWTManager(app)

# MongoDB configuration
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/TrueTaleDB")  # Change to your MongoDB URI
mongo = PyMongo(app)

# Cache for analysis results
analysis_cache = {}

def rate_limit(limit_per_minute):
    def decorator(f):
        last_called = [0] 

        @wraps(f)
        def wrapped(*args, **kwargs):
            current_time = time.time()
            elapsed_time = current_time - last_called[0]
            wait_time = 60 / limit_per_minute

            if elapsed_time < wait_time:
                time.sleep(wait_time - elapsed_time)

            last_called[0] = time.time()
            return f(*args, **kwargs)

        return wrapped
    return decorator

@app.route('/fetch_reviews', methods=['GET'])
@rate_limit(10) 
@jwt_required()  # Protect this endpoint with JWT
def fetch_reviews():
    """Fetch reviews from Google Places API based on place_id for TrueTale."""
    place_id = request.args.get('place_id')
    logger.info(f"Fetching reviews for place_id: {place_id}")
    
    if not place_id:
        logger.error("No place_id provided.")
        return jsonify({'error': 'place_id is required'}), 400

    api_key = 'YOUR_TRUE_TALE_GOOGLE_PLACES_API_KEY'  # Update with TrueTale's API key
    url = f'https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&key={api_key}'
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses
        data = response.json()
        
        reviews = data.get('result', {}).get('reviews', [])
        
        # Check if the analysis results are cached
        cache_key = place_id  # Use place_id as the cache key
        if cache_key in analysis_cache:
            logger.info("Using cached analysis results.")
            return jsonify(analysis_cache[cache_key]), 200

        # Example user history for analysis
        user_history = {
            'activity_frequency': 6,  # Example value
            'reviewed_products': ['product1', 'product2']  # Example list
        }

        # Analyze reviews
        analysis_results = analyze_reviews(reviews, user_history)
        
        # Store results in cache
        analysis_cache[cache_key] = analysis_results

        return jsonify(analysis_results), 200
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching reviews: {str(e)}")
        return jsonify({'error': 'Failed to fetch reviews from the API.'}), 500

@app.route('/feedback', methods=['POST'])
@jwt_required()  # Protect this endpoint with JWT
def handle_feedback():
    """Handle feedback submission from the frontend."""
    feedback_data = request.json
    logger.info(f"Received feedback: {feedback_data}")
    review_text = feedback_data.get('review_text')
    prediction = feedback_data.get('prediction')
    feedback = feedback_data.get('feedback')

    # Store feedback in MongoDB
    mongo.db.feedback.insert_one({
        'review_text': review_text,
        'prediction': prediction,
        'feedback': feedback,
        'submitted_at': datetime.datetime.now()
    })

    print(f"Received feedback: {feedback} for review: {review_text} with prediction: {prediction}")

    return jsonify({'message': 'Feedback received successfully'}), 200

# Load your ML model once when the app starts
model = load_model('path_to_your_model.h5')  # Specify the correct path to your model

# Define the preprocess_review function
def preprocess_review(review_text):
    return clean_text(review_text)  # Use the clean_text function to preprocess the review

@app.route('/predict', methods=['POST'])
@jwt_required()  # Protect this endpoint with JWT
def predict():
    """Predict whether a review is fake or genuine."""
    review_data = request.json
    review_text = review_data.get('review_text')

    if not review_text:
        return jsonify({'error': 'Review text is required.'}), 400

    try:
        # Preprocess the review text
        processed_text = preprocess_review(review_text)
        prediction = model.predict(np.array([processed_text]))

        # Create a user-friendly response
        response = {
            'prediction': prediction.tolist(),
            'message': 'Prediction completed successfully.'
        }
        
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return jsonify({'error': 'An error occurred during prediction. Please try again later.'}), 500

@app.route('/login', methods=['POST'])
def login():
    """User login to obtain JWT."""
    id_token_received = request.json.get('id_token')
    
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(id_token_received, google_requests.Request(), audience='YOUR_GOOGLE_CLIENT_ID')  # Replace with your client ID
        username = idinfo['email']  # Use email as the identity

        # Create access token
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/report', methods=['POST'])
@jwt_required()  # Protect this endpoint with JWT
def report_review():
    """Handle user reports for flagged reviews."""
    report_data = request.json
    review_text = report_data.get('review_text')

    if not review_text:
        return jsonify({'error': 'Review text is required.'}), 400

    # Store the report in MongoDB
    mongo.db.reports.insert_one({
        'review_text': review_text,
        'reported_at': datetime.datetime.now()
    })

    # Optionally, trigger a re-evaluation process here
    # re_evaluate_review(review_text)

    return jsonify({'message': 'Thank you for your report! We will review it.'}), 200

def clear_cache():
    """Clear the cache periodically."""
    global analysis_cache
    while True:
        time.sleep(3600)  # Clear cache every hour
        analysis_cache.clear()
        logger.info("Cache cleared.")

# Start the cache clearing thread
threading.Thread(target=clear_cache, daemon=True).start()

@app.route('/analyze_reviews', methods=['POST'])
@jwt_required()
def analyze_reviews():
    data = request.json
    reviews = data.get('reviews', [])
    user_history = data.get('user_history', [])

    # Analyze reviews
    analysis_results = analyze_reviews_logic(reviews, user_history)
    
    # Store results in cache or database if needed
    # ...

    return jsonify(analysis_results), 200

def analyze_reviews_logic(reviews, user_history):
    results = []
    for review in reviews:
        # Example logic for analysis
        result = {
            'id': review['id'],
            'is_fake': False,  # Replace with actual analysis logic
            'is_suspicious': False,
            'reasons': []
        }
        results.append(result)
    return results

if __name__ == '__main__':
    app.run(debug=True)
