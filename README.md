# TruthTale Fake Review Remover

## Overview
This project is designed to detect and remove fake reviews from a dataset. It includes a Flask API for prediction, a browser extension for user interaction, and machine learning scripts for training and evaluating the model.

## Features
- **Fake Review Detection**: The project uses a machine learning model to predict whether a review is fake or genuine.
- **Flask API**: A RESTful API that provides endpoints for prediction and retraining the model.
- **Browser Extension**: A user-friendly browser extension that allows users to check the authenticity of reviews directly from their browser.
- **Model Retraining**: The ability to retrain the model with new data to improve its accuracy.
- **Dataset Preprocessing**: Scripts for preprocessing the dataset to prepare it for training.
- **Model Evaluation**: Scripts for evaluating the performance of the trained model.
- and other features....

## Project Structure
- `app/`: Contains the API endpoints and models.
  - `api/`: API endpoints.
    - `predict.py`: Endpoint for prediction.
    - `reviews.py`: Endpoint for handling reviews.
    - `retrain_model.py`: Endpoint for retraining the model.
  - `models.py`: Database models.
- `extension/`: Contains the browser extension files.
  - `content.js`: Content script for the browser extension.
  - `popup.html`: HTML for the browser extension popup.
  - `popup.js`: JavaScript for the browser extension popup.
- `ml/`: Contains machine learning scripts and models.
  - `preprocessing.py`: Preprocessing script for the dataset.
  - `evaluation.py`: Evaluation script for the model.
  - `model.py`: Machine learning model.
  - `synthetic_reviews.py`: Script for generating synthetic reviews.
  - `train_model.py`: Script for training the model.
- `manifest.json`: Configuration file for the browser extension.
- `reviews.csv`: Dataset for reviews.

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/google-fake-review-remover.git
   cd google-fake-review-remover
   ```

2. Install the required dependencies:
   ```sh
   pip install -r requirements.txt
   ```

3. Train the model:
   ```sh
   python ml/train_model.py
   ```

4. Run the Flask API:
   ```sh
   python app/api/predict.py
   ```

5. Load the browser extension:
   - Open your browser's extension management page (e.g., `chrome://extensions/` for Chrome).
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `extension/` directory.

## Usage
### API
- **Prediction Endpoint**:
  - URL: `http://localhost:5000/api/predict`
  - Method: POST
  - Request Body:
    ```json
    {
      "review": "This is a sample review."
    }
    ```
  - Response:
    ```json
    {
      "is_fake": true
    }
    ```

- **Retrain Model Endpoint**:
  - URL: `http://localhost:5000/api/retrain_model`
  - Method: POST
  - Request Body:
    ```json
    {
      "dataset_path": "path/to/dataset.csv"
    }
    ```
  - Response:
    ```json
    {
      "status": "Model retrained successfully."
    }
    ```

### Browser Extension
- Click on the browser extension icon to open the popup.
- Enter a review in the text area and click "Check".
- The extension will send the review to the API and display the result.

## Key Files
- `app/api/predict.py`: API endpoint for prediction.
- `app/api/reviews.py`: API endpoint for handling reviews.
- `app/models.py`: Database models.
- `extension/content.js`: Content script for the browser extension.
- `extension/popup.html`: HTML for the browser extension popup.
- `extension/popup.js`: JavaScript for the browser extension popup.
- `ml/preprocessing.py`: Preprocessing script for the dataset.
- `ml/evaluation.py`: Evaluation script for the model.
- `ml/model.py`: Machine learning model.
- `ml/synthetic_reviews.py`: Script for generating synthetic reviews.
- `ml/train_model.py`: Script for training the model.

## Additional Information
- The project uses a Flask API to serve predictions and a browser extension for user interaction.
- The machine learning model is trained using a dataset of reviews and can be retrained with new data.
- The browser extension sends reviews to the API and displays the results.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or fixes.

## License
This project is licensed under the Scaler School of Technology Students. 

## Contact
For any questions or feedback, please contact ______________.

=======
