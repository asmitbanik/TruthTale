import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import make_pipeline
import joblib
from ml.synthetic_reviews import generate_synthetic_review 


data = pd.read_csv('reviews.csv')

synthetic_reviews = [generate_synthetic_review(review) for review in data['text']]
synthetic_labels = data['label'].sample(len(synthetic_reviews), replace=True).values 
data = data.append(pd.DataFrame({'text': synthetic_reviews, 'label': synthetic_labels}), ignore_index=True)

X_train, X_test, y_train, y_test = train_test_split(data['text'], data['label'], test_size=0.2, random_state=42)

pipeline = make_pipeline(TfidfVectorizer(), RandomForestClassifier(random_state=42))

param_grid = {
    'randomforestclassifier__n_estimators': [50, 100, 200],
    'randomforestclassifier__max_depth': [None, 10, 20, 30],
}
grid_search = GridSearchCV(pipeline, param_grid, cv=5)
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_
cv_scores = cross_val_score(best_model, X_train, y_train, cv=5)
print("Cross-Validation Accuracy:", cv_scores.mean())

best_model.fit(X_train, y_train)

joblib.dump(best_model, 'path_to_your_model.pkl') 
