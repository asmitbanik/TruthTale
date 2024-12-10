import random
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

def generate_synthetic_review(original_review):
    lemmatizer = WordNetLemmatizer()
    tokens = nltk.word_tokenize(original_review)
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in stopwords.words('english')]
    
    # Randomly select a subset of tokens
    synthetic_tokens = random.sample(tokens, min(len(tokens), 5))  # Adjust the number as needed
    return ' '.join(synthetic_tokens) 