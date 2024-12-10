from flask import request, jsonify
from flask_jwt_extended import jwt_required
from app import app  # Import the app instance
from app.api.reviews import analyze_reviews  # Adjust the import path as necessary
from ml.model import load_model  # Import the function to load your model

# Load the model globally or within the function
model = load_model()  # Ensure this function returns the model instance

@app.route('/retrain_model', methods=['POST'])
@jwt_required()
def retrain_model():
    try:
        new_data = request.json.get('new_data')
        if not new_data:
            return jsonify({'error': 'No new data provided'}), 400
        
        # Logic to retrain the model with new data
        model.retrain(new_data)  # Call the retrain method with the new data
        # Example: model.save()  # Save the updated model if necessary

        return jsonify({'message': 'Model retrained successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 