import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from textblob import TextBlob 
import string
from collections import Counter
import datetime

nltk.download('stopwords')
nltk.download('punkt')
nltk.download('wordnet')

def clean_text(text):
    if not isinstance(text, str):
        return ""
    
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)  
    text = re.sub(r'[^\w\s]', '', text)  
    text = re.sub(r'\d+', '', text) 
    return text.strip() 

def preprocess_data(file_paths):
    all_data = []

    for file_path in file_paths:
        df = pd.read_csv(file_path)

        df.dropna(subset=['review_text', 'is_fake'], inplace=True)

        if 'review_text' not in df.columns or 'is_fake' not in df.columns:
            raise ValueError("Dataset must contain 'review_text' and 'is_fake' columns.")

        df['cleaned_text'] = df['review_text'].apply(clean_text)
        df['tokenized_text'] = df['cleaned_text'].apply(nltk.word_tokenize)

        lemmatizer = WordNetLemmatizer()
        df['processed_text'] = df['tokenized_text'].apply(lambda tokens: ' '.join([lemmatizer.lemmatize(token) for token in tokens if token not in stopwords.words('english')]))

        df['review_length'] = df['cleaned_text'].apply(lambda x: len(x.split()))
        df['sentiment_score'] = df['review_text'].apply(lambda x: TextBlob(x).sentiment.polarity)
        df['word_count'] = df['cleaned_text'].apply(lambda x: len(x.split()))

        all_data.append(df[['processed_text', 'is_fake', 'review_length', 'sentiment_score', 'word_count']])

    combined_df = pd.concat(all_data, ignore_index=True)

    return train_test_split(combined_df.drop('is_fake', axis=1), combined_df['is_fake'], test_size=0.2, random_state=42)

def analyze_reviews(reviews, user_history):
    analysis_results = []

    for review in reviews:
        result = {
            'review_text': review['text'],
            'is_fake': False,
            'reasons': []
        }

        if user_history['activity_frequency'] > 5:
            result['is_fake'] = True
            result['reasons'].append('High activity frequency.')

        if len(set(user_history['reviewed_products'])) < 3: 
            result['is_fake'] = True
            result['reasons'].append('Narrow diversity of reviews.')

        vague_phrases = ['great product', 'highly recommended', 'best ever']
        if any(phrase in review['text'].lower() for phrase in vague_phrases):
            result['is_fake'] = True
            result['reasons'].append('Contains vague language.')

        if len(review['text'].split()) < 5:
            result['is_fake'] = True
            result['reasons'].append('Review is too brief.')

        review_date = datetime.datetime.strptime(review['date'], '%Y-%m-%d')
        if (datetime.datetime.now() - review_date).days < 1: 
            result['is_fake'] = True
            result['reasons'].append('Posted within a suspicious timeframe.')

        if TextBlob(review['text']).sentiment.polarity < 0.1: 
            result['is_fake'] = True
            result['reasons'].append('Negative sentiment detected.')

        promotional_phrases = ['buy now', 'limited time offer', 'free gift']
        if any(phrase in review['text'].lower() for phrase in promotional_phrases):
            result['is_fake'] = True
            result['reasons'].append('Contains promotional language.')

        if reviews.count(review['text']) > 1: 
            result['is_fake'] = True
            result['reasons'].append('Duplicate content detected.')

        analysis_results.append(result)

    return analysis_results
