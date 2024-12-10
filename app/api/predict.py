from flask import Flask, jsonify, request
from ml.model import tune_and_evaluate_model 
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token
from marshmallow import Schema, fields, ValidationError
from functools import wraps
import time
from app.models import Review, db  

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "https://truetale.com"}}) 
app.config['JWT_SECRET_KEY'] = 'TrueTale_YourActualStrongRandomSecretKey' 
jwt = JWTManager(app)

requests_per_minute = 60
user_requests = {}

def rate_limiter(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_ip = request.remote_addr
        current_time = time.time()
        if user_ip not in user_requests:
            user_requests[user_ip] = []
        user_requests[user_ip] = [timestamp for timestamp in user_requests[user_ip] if current_time - timestamp < 60]
        if len(user_requests[user_ip]) >= requests_per_minute:
            return jsonify({"message": "Too many requests"}), 429
        user_requests[user_ip].append(current_time)
        return f(*args, **kwargs)
    return decorated_function

class InputSchema(Schema):
    data = fields.Str(required=True)

tokenizer = BertTokenizer.from_pretrained('./multilingual_model')
model = BertForSequenceClassification.from_pretrained('./multilingual_model')

@app.route('/api/predict', methods=['POST'])
@jwt_required()  
@rate_limiter  
def predict():
    try:
        input_data = InputSchema().load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    try:
        review_text = input_data.get('data')
        if not review_text:
            return jsonify({'error': 'No review text provided'}), 400
        
        inputs = tokenizer(review_text, return_tensors='pt', truncation=True, padding=True)
        
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = torch.argmax(outputs.logits, dim=-1).item()
        
        return jsonify({'prediction': bool(predictions)})  
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token)

@app.route('/feedback', methods=['POST'])
def handle_feedback():
    feedback_data = request.json
    review_text = feedback_data.get('review_text')
    prediction = feedback_data.get('prediction')
    feedback = feedback_data.get('feedback')

    new_feedback = Review(text=review_text, is_fake=prediction)
    db.session.add(new_feedback)
    db.session.commit()

    print(f"Received feedback: {feedback} for review: {review_text} with prediction: {prediction}")

    return jsonify({'message': 'Feedback received successfully'})

if __name__ == '__main__':
    app.run(debug=True)
