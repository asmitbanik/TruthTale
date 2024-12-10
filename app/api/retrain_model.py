from flask import request, jsonify
from flask_jwt_extended import jwt_required
from app import app 
from app.api.reviews import analyze_reviews 
from ml.model import load_model 

model = load_model() 

@app.route('/retrain_model', methods=['POST'])
@jwt_required()
def retrain_model():
    try:
        new_data = request.json.get('new_data')
        if not new_data:
            return jsonify({'error': 'No new data provided'}), 400
        
        model.retrain(new_data)
        model.save()  

        return jsonify({'message': 'Model retrained successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
