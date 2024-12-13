from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.metrics import classification_report, confusion_matrix
import joblib

def tune_and_evaluate_model(X_train, y_train, X_test, y_test):
    param_grid = {
        'vectorizer__max_features': [1000, 5000],
        'classifier__C': [0.1, 1, 10]
    }

    pipeline = make_pipeline(TfidfVectorizer(), LogisticRegression())

    grid_search = GridSearchCV(pipeline, param_grid, cv=5)
    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_
    cv_scores = cross_val_score(best_model, X_train, y_train, cv=5)
    print("Cross-Validation Accuracy:", cv_scores.mean())

    predictions = best_model.predict(X_test)

    print("Accuracy:", best_model.score(X_test, y_test))
    print("Classification Report:\n", classification_report(y_test, predictions))
    print("Confusion Matrix:\n", confusion_matrix(y_test, predictions)) 

def load_model():
    model = joblib.load('path_to_your_model.pkl')  
    return model

def predict(input_data):
    model = load_model()
    prediction = model.predict([input_data]) 
    return prediction 
