    let jwtToken = ''; 
    let isLoggedIn = false; 

    function onSignIn(googleUser) {
        const profile = googleUser.getBasicProfile();
        console.log('ID: ' + profile.getId()); 
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail());

        document.getElementById('startAnalysis').disabled = false; 
        document.getElementById('feedbackInput').disabled = false; 
        document.getElementById('submitFeedback').disabled = false;

        const id_token = googleUser.getAuthResponse().id_token;
        loginWithGoogle(id_token);
    }

    async function loginWithGoogle(id_token) {
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token }),
            });

            if (!response.ok) {
                throw new Error('Login failed: ' + response.statusText);
            }

            const data = await response.json();
            jwtToken = data.access_token; 
            isLoggedIn = true; 
        } catch (error) {
            console.error('Error during Google login:', error);
            alert('Login failed. Please try again.');
        }
    }

    async function login(username, password) {
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed: ' + response.statusText);
            }

            const data = await response.json();
            jwtToken = data.access_token;
        } catch (error) {
            console.error('Error during login:', error);
            alert('Login failed. Please check your credentials and try again.');
        }
    }

    async function login(username, password) {
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
    
            if (!response.ok) {
                throw new Error('Login failed: ' + response.statusText);
            }
    
            const data = await response.json();
            jwtToken = data.access_token;
            isLoggedIn = true;
            console.log('Login successful');
        } catch (error) {
            console.error('Error during login:', error);
            alert('Login failed. Please check your credentials and try again.');
        }
    }

    document.getElementById('startAnalysis').addEventListener('click', async () => {
        if (!isLoggedIn) {
            alert('Please log in with Google to scan reviews.');
            return;
        }

        const placeId = document.getElementById('siteSelect').value; 
        document.getElementById('loading').style.display = 'block'; 
        document.getElementById('errorMessage').style.display = 'none'; 

        try {
            const response = await fetch(`/fetch_reviews?place_id=${placeId}`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}` 
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error fetching reviews');
            }

            const reviews = await response.json();
            document.getElementById('result').innerText = JSON.stringify(reviews);

            document.getElementById('feedbackInput').disabled = false;
            document.getElementById('submitFeedback').disabled = false;

        } catch (error) {
            console.error('Error fetching reviews:', error);
            document.getElementById('errorMessage').innerText = error.message; 
            document.getElementById('errorMessage').style.display = 'block'; 
        } finally {
            document.getElementById('loading').style.display = 'none'; 
        }
    });

    document.getElementById('submitFeedback').addEventListener('click', async () => {
        const feedbackInput = document.getElementById('feedbackInput').value;
        const reviewText = "Sample review text"; // Replace karlena with actual review text
        const prediction = "fake"; // Replace kardena with actual prediction

        try {
            const response = await fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ review_text: reviewText, prediction, feedback: feedbackInput }),
            });

            if (!response.ok) {
                throw new Error('Error submitting feedback: ' + response.statusText);
            }

            const result = await response.json();
            document.getElementById('feedbackResult').innerText = result.message;
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('An error occurred while submitting feedback. Please try again.');
        }
    });

    function handleSiteSelection() {
        const siteSelect = document.getElementById('siteSelect');
        const sites = ['google', 'yelp', 'amazon', 'tripadvisor', 'trustpilot'];
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.innerText = site.charAt(0).toUpperCase() + site.slice(1);
            siteSelect.appendChild(option);
        });
    }

    handleSiteSelection();

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
                reviews = document.querySelectorAll('.section-review-content'); 
                break;
            case 'yelp':
                reviews = document.querySelectorAll('.review');
                break;
            case 'amazon':
                reviews = document.querySelectorAll('.review-text');
                break;
            case 'tripadvisor':
                reviews = document.querySelectorAll('.partial_entry'); 
                break;
            case 'trustpilot':
                reviews = document.querySelectorAll('.review-content__text'); 
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

    function displayReviews(analysisResults) {
        const reviewsContainer = document.getElementById('reviewsContainer');
        reviewsContainer.innerHTML = ''; 

        analysisResults.forEach(result => {
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review';
            reviewDiv.innerHTML = `
                <p>${result.review_text}</p>
                <p>Status: ${result.is_fake ? 'Flagged as Fake' : 'Genuine'}</p>
                <p>Reasons: ${result.reasons.join(', ')}</p>
                <button class="reportButton" data-review-text="${result.review_text}">Report</button>
            `;
            reviewsContainer.appendChild(reviewDiv);
        });

        document.querySelectorAll('.reportButton').forEach(button => {
            button.addEventListener('click', () => {
                const reviewText = button.getAttribute('data-review-text');
                reportReview(reviewText);
            });
        });
    }

    async function reportReview(reviewText) {
        try {
            const response = await fetch('/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ review_text: reviewText }),
            });

            if (!response.ok) {
                throw new Error('Error reporting review: ' + response.statusText);
            }

            const result = await response.json();
            alert(result.message); 
        } catch (error) {
            console.error('Error reporting review:', error);
            alert('An error occurred while reporting the review. Please try again.');
        }
    }
