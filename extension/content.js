chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "scanReviews") {
        fetchReviewsFromSite(request.site); 
        sendResponse({ message: "Scanning for fake reviews..." });
    }
});

function fetchReviewsFromSite(site) {
    showLoadingIndicator();

    let reviews;

    switch (site) {
        case 'google':
            reviews = document.querySelectorAll('.section-review-content'); // Google Maps
            break;
        case 'yelp':
            reviews = document.querySelectorAll('.review'); // Yelp
            break;
        case 'amazon':
            reviews = document.querySelectorAll('.review-text'); // Amazon
            break;
        case 'tripadvisor':
            reviews = document.querySelectorAll('.partial_entry'); // TripAdvisor
            break;
        case 'trustpilot':
            reviews = document.querySelectorAll('.review-content__text'); // Trustpilot
            break;
        default:
            console.warn('Unsupported site');
            return;
    }

    if (reviews.length === 0) {
        hideLoadingIndicator();
        alert('No reviews found for the selected site.');
        return;
    }

    reviews.forEach(review => {
        const reviewText = review.innerText;
        sendReviewForPrediction(reviewText);
    });

    hideLoadingIndicator();
}

function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.innerText = 'Loading reviews...';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.padding = '10px 20px';
    loadingIndicator.style.borderRadius = '5px';
    loadingIndicator.style.zIndex = '1000';
    document.body.appendChild(loadingIndicator);
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

function sendReviewForPrediction(reviewText) {
    fetch('https://your-server-domain.com/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ review_text: reviewText })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Prediction:', data.prediction);  
        alert(`Prediction: ${data.prediction}\nMessage: ${data.message}`);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while fetching the prediction. Please try again.');
    });
}

function analyzeSentiment(reviewText) {
    return fetch('https://api.sentimentanalysis.com/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: reviewText }),
    })
    .then(response => response.json())
    .then(data => data.sentimentScore); 
}

function highlightReviews(reviews) {
    reviews.forEach(review => {
        const reviewElement = document.querySelector(`#review-${review.id}`);
        if (reviewElement) {
            const flag = document.createElement('span');
            flag.className = 'flag';
            if (review.is_fake) {
                flag.classList.add('flag-red');
            } else if (review.is_suspicious) {
                flag.classList.add('flag-yellow');
            } else {
                flag.classList.add('flag-green');
            }
            reviewElement.prepend(flag); 

            reviewElement.addEventListener('mouseover', () => {
                const details = `Reasons: ${review.reasons.join(', ')}\nSentiment: ${review.sentimentScore}`;
                showTooltip(details, reviewElement);
            });

            createFeedbackButtons(reviewElement, review);

            analyzeSentiment(review.text).then(sentimentScore => {
                review.sentimentScore = sentimentScore; 
            });
        }
    });
}

function createFeedbackButtons(reviewElement, review) {
    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = 'feedback-container';

    const thumbsUpButton = document.createElement('button');
    thumbsUpButton.innerText = '👍';
    thumbsUpButton.onclick = () => submitFeedback(review.id, true); 

    const thumbsDownButton = document.createElement('button');
    thumbsDownButton.innerText = '👎';
    thumbsDownButton.onclick = () => submitFeedback(review.id, false); 

    feedbackContainer.appendChild(thumbsUpButton);
    feedbackContainer.appendChild(thumbsDownButton);
    reviewElement.appendChild(feedbackContainer);
}

function submitFeedback(reviewId, isPositive) {
    fetch('/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_id: reviewId, is_positive: isPositive }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); 
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        alert('An error occurred while submitting feedback. Please try again.');
    });
}

function showNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png', 
        title: 'New Review Alert',
        message: message,
        priority: 2
    });
}

function fetchReviews() {
    const reviews = [];
    if (reviews.length > 0) {
        showNotification(`Found ${reviews.length} new reviews!`);
    }
    chrome.runtime.sendMessage({action: "analyze", reviews: reviews});
}

fetchReviews();

function exportResults(reviews) {
    const csvContent = "data:text/csv;charset=utf-8," 
        + reviews.map(review => `${review.id},${review.is_fake},${review.sentimentScore}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "review_analysis.csv");
    document.body.appendChild(link);

    link.click();
}

const exportButton = document.createElement('button');
exportButton.innerText = 'Export Results';
exportButton.onclick = () => exportResults(reviews); 
document.body.appendChild(exportButton);

function saveSettings(settings) {
    chrome.storage.sync.set({ userSettings: settings }, () => {
        console.log('Settings saved');
    });
}

function loadSettings() {
    chrome.storage.sync.get('userSettings', (data) => {
        if (data.userSettings) {
            toggleDarkMode(data.userSettings.darkMode);
            
            if (data.userSettings.notificationPreferences) {
                saveNotificationPreferences(data.userSettings.notificationPreferences); 
            }

            if (data.userSettings.language) {
                setLanguage(data.userSettings.language);
            }
            if (data.userSettings.layout) {
                applyLayout(data.userSettings.layout); 
            }
        }
    });
}

loadSettings();

function saveUserProfile(profileData) {
    chrome.storage.sync.set({ userProfile: profileData }, () => {
        console.log('User profile saved');
    });
}

function loadUserProfile() {
    chrome.storage.sync.get('userProfile', (data) => {
        if (data.userProfile) {
            document.getElementById('username').value = data.userProfile.username;
            document.getElementById('email').value = data.userProfile.email;
        }
    });
}

loadUserProfile();

function compareReviews(source1Reviews, source2Reviews) {
    const comparisonContainer = document.createElement('div');
    comparisonContainer.className = 'comparison-container';

    source1Reviews.forEach((review, index) => {
        const reviewElement = document.createElement('div');
        reviewElement.innerHTML = `
            <h3>Source 1 Review</h3>
            <p>${review.text}</p>
            <h3>Source 2 Review</h3>
            <p>${source2Reviews[index] ? source2Reviews[index].text : 'No review available'}</p>
        `;
        comparisonContainer.appendChild(reviewElement);
    });

    document.body.appendChild(comparisonContainer);
}

function filterReviews(reviews, criteria) {
    return reviews.filter(review => {
        const matchesRating = review.rating >= criteria.minRating;
        const matchesDate = new Date(review.date) >= new Date(criteria.startDate);
        const matchesKeyword = review.text.toLowerCase().includes(criteria.keyword.toLowerCase());
        return matchesRating && matchesDate && matchesKeyword;
    });
}

const filteredReviewsByRating = filterReviews(allReviews, { minRating: 4, startDate: '2023-01-01', keyword: 'excellent' });

function createShareButtons(reviewElement, review) {
    const shareContainer = document.createElement('div');
    shareContainer.className = 'share-container';

    const twitterButton = document.createElement('button');
    twitterButton.innerText = 'Share on X';
    twitterButton.onclick = () => {
        const tweetText = `Check out this review: ${review.text}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`);
    };

    const facebookButton = document.createElement('button');
    facebookButton.innerText = 'Share on Facebook';
    facebookButton.onclick = () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
        window.open(shareUrl);
    };

    const linkedinButton = document.createElement('button');
    linkedinButton.innerText = 'Share on LinkedIn';
    linkedinButton.onclick = () => {
        const shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(review.text)}`;
        window.open(shareUrl);
    };

    const instagramButton = document.createElement('button');
    instagramButton.innerText = 'Share on Instagram';
    instagramButton.onclick = () => {
        alert('Instagram sharing is not supported directly via URL. Please copy the text and share it on Instagram.');
    };

    const snapchatButton = document.createElement('button');
    snapchatButton.innerText = 'Share on Snapchat';
    snapchatButton.onclick = () => {
        alert('Snapchat sharing is not supported directly via URL. Please copy the text and share it on Snapchat.');
    };

    // Append buttons to the share container
    shareContainer.appendChild(twitterButton);
    shareContainer.appendChild(facebookButton);
    shareContainer.appendChild(linkedinButton);
    shareContainer.appendChild(instagramButton);
    shareContainer.appendChild(snapchatButton);

    reviewElement.appendChild(shareContainer);
}

// Function to notify users about updates
function notifyUpdate(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Extension Update',
        message: message,
        priority: 2
    });
}

// Call this function when an update is available
notifyUpdate('New features have been added to the extension!');

// Function to save user notification preferences
function saveNotificationPreferences(preferences) {
    chrome.storage.sync.set({ notificationPreferences: preferences }, () => {
        console.log('Notification preferences saved');
    });
}

// Function to load user notification preferences
function loadNotificationPreferences() {
    chrome.storage.sync.get('notificationPreferences', (data) => {
        if (data.notificationPreferences) {
            // Apply preferences to your extension
        }
    });
}

// Call loadNotificationPreferences on extension startup
loadNotificationPreferences();

// Function to create a rating system for each review
function createRatingSystem(reviewElement, review) {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating-container';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.innerText = '⭐';
        star.onclick = () => submitRating(review.id, i); // Submit rating
        ratingContainer.appendChild(star);
    }

    reviewElement.appendChild(ratingContainer);
}

// Function to submit rating
function submitRating(reviewId, rating) {
    fetch('/rate_review', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_id: reviewId, rating: rating }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Notify user of rating submission
    })
    .catch(error => {
        console.error('Error submitting rating:', error);
        alert('An error occurred while submitting your rating. Please try again.');
    });
}

// Function to create a chart for review analysis
function createReviewChart(reviews) {
    const ctx = document.getElementById('reviewChart').getContext('2d');
    const labels = ['Fake', 'Suspicious', 'Genuine'];
    const data = [
        reviews.filter(review => review.is_fake).length,
        reviews.filter(review => review.is_suspicious).length,
        reviews.filter(review => !review.is_fake && !review.is_suspicious).length
    ];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Review Analysis',
                data: data,
                backgroundColor: ['red', 'yellow', 'green'],
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to fetch reviews from Trustpilot
function fetchTrustpilotReviews(businessId) {
    fetch(`https://api.trustpilot.com/v1/reviews?businessId=${businessId}`, {
        headers: {
            'Authorization': 'Bearer YOUR_TRUSTPILOT_API_KEY'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Process and display Trustpilot reviews
        displayReviews(data.reviews);
    })
    .catch(error => {
        console.error('Error fetching Trustpilot reviews:', error);
    });
}

// Function to toggle dark mode
function toggleDarkMode(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Example CSS for dark mode
const style = document.createElement('style');
style.innerHTML = `
    .dark-mode {
        background-color: #121212;
        color: #ffffff;
    }
`;
document.head.appendChild(style);

// Function to update user profile
function updateUserProfile(newProfileData) {
    chrome.storage.sync.set({ userProfile: newProfileData }, () => {
        console.log('User profile updated');
    });
}

// Function to sort reviews
function sortReviews(reviews, criteria) {
    return reviews.sort((a, b) => {
        if (criteria === 'date') {
            return new Date(b.date) - new Date(a.date);
        } else if (criteria === 'rating') {
            return b.rating - a.rating;
        } else {
            return 0; // Default case
        }
    });
}

// Example usage
const sortedReviews = sortReviews(allReviews, 'date');

// Function to search reviews
function searchReviews(reviews, query) {
    return reviews.filter(review => review.text.toLowerCase().includes(query.toLowerCase()));
}

// Example usage
const searchQuery = document.getElementById('searchInput').value;
const filteredReviewsBySearch = searchReviews(allReviews, searchQuery);

// Function to apply user-defined highlighting
function applyUserHighlighting(reviews) {
    reviews.forEach(review => {
        const reviewElement = document.querySelector(`#review-${review.id}`);
        if (reviewElement) {
            if (review.is_fake) {
                reviewElement.style.backgroundColor = userPreferences.fakeColor; // User-defined color
            } else if (review.is_suspicious) {
                reviewElement.style.backgroundColor = userPreferences.suspiciousColor; // User-defined color
            } else {
                reviewElement.style.backgroundColor = userPreferences.genuineColor; // User-defined color
            }
        }
    });
}

// Function to get real-time predictions
function getRealTimePrediction(reviewText) {
    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_text: reviewText }),
    })
    .then(response => response.json())
    .then(data => {
        alert(`Prediction: ${data.prediction}`); // Display prediction
    })
    .catch(error => {
        console.error('Error getting prediction:', error);
        alert('An error occurred while getting the prediction. Please try again.');
    });
}

// Example usage
const inputText = document.getElementById('realTimeInput').value;
getRealTimePrediction(inputText);

// Function to generate user analytics
function generateUserAnalytics(reviews) {
    const totalReviews = reviews.length;
    const fakeReviews = reviews.filter(review => review.is_fake).length;
    const genuineReviews = reviews.filter(review => !review.is_fake).length;

    document.getElementById('analytics').innerHTML = `
        <h3>User Analytics</h3>
        <p>Total Reviews Analyzed: ${totalReviews}</p>
        <p>Fake Reviews: ${fakeReviews}</p>
        <p>Genuine Reviews: ${genuineReviews}</p>
    `;
}

// Function to send reviews for analysis
function sendReviewsForAnalysis(reviews) {
    fetch('/analyze_reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews: reviews, user_history: userHistory }), // Include user history if needed
    })
    .then(response => response.json())
    .then(data => {
        console.log('Analysis Results:', data);
        // Process the analysis results
    })
    .catch(error => {
        console.error('Error analyzing reviews:', error);
    });
}

// Function to create a sentiment analysis chart
function createSentimentChart(sentimentData) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    const labels = ['Positive', 'Negative', 'Neutral'];
    const data = [
        sentimentData.positive,
        sentimentData.negative,
        sentimentData.neutral
    ];

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['green', 'red', 'gray'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Sentiment Analysis'
                }
            }
        }
    });
}

// Function to load user review history
function loadUserReviewHistory() {
    chrome.storage.sync.get('userReviewHistory', (data) => {
        if (data.userReviewHistory) {
            const historyContainer = document.getElementById('reviewHistory');
            data.userReviewHistory.forEach(review => {
                const reviewElement = document.createElement('div');
                reviewElement.innerHTML = `
                    <h4>${review.title}</h4>
                    <p>${review.text}</p>
                    <p>Status: ${review.is_fake ? 'Fake' : 'Genuine'}</p>
                `;
                historyContainer.appendChild(reviewElement);
            });
        }
    });
}

// Call loadUserReviewHistory on extension startup
loadUserReviewHistory();

function showTooltip(message, targetElement) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerText = message;
    document.body.appendChild(tooltip);

    const rect = targetElement.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.top = `${rect.top + window.scrollY}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.zIndex = '1001';

    setTimeout(() => {
        tooltip.remove();
    }, 3000); // Tooltip will disappear after 3 seconds
}
