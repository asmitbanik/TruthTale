    let jwtToken = ''; // Variable to store the JWT token
    let isLoggedIn = false; // Track login status

    // Function to handle Google Sign-In
    function onSignIn(googleUser) {
        const profile = googleUser.getBasicProfile();
        console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail());

        // Enable buttons after successful login
        document.getElementById('startAnalysis').disabled = false; // Enable analysis button
        document.getElementById('feedbackInput').disabled = false; // Enable feedback input
        document.getElementById('submitFeedback').disabled = false; // Enable feedback button

        // Optionally, you can send the ID token to your backend for verification
        const id_token = googleUser.getAuthResponse().id_token;
        // Send id_token to your backend for verification and JWT generation
        loginWithGoogle(id_token);
    }

    // Function to log in with Google ID token
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
            jwtToken = data.access_token; // Store the token
            isLoggedIn = true; // Update login status
        } catch (error) {
            console.error('Error during Google login:', error);
            alert('Login failed. Please try again.');
        }
    }

    // Function to log in and get the JWT token
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
            jwtToken = data.access_token; // Store the token
        } catch (error) {
            console.error('Error during login:', error);
            alert('Login failed. Please check your credentials and try again.');
        }
    }

    // Call this function when the user logs in
    // Example usage: login('your_username', 'your_password');

    // Event listener for starting analysis
    document.getElementById('startAnalysis').addEventListener('click', async () => {
        if (!isLoggedIn) {
            alert('Please log in with Google to scan reviews.');
            return;
        }

        const placeId = document.getElementById('siteSelect').value; // Get selected site
        document.getElementById('loading').style.display = 'block'; // Show loading
        document.getElementById('errorMessage').style.display = 'none'; // Hide previous error messages

        try {
            const response = await fetch(`/fetch_reviews?place_id=${placeId}`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}` // Include the JWT token
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error fetching reviews');
            }

            const reviews = await response.json();
            document.getElementById('result').innerText = JSON.stringify(reviews);

            // Enable feedback input and button after analysis
            document.getElementById('feedbackInput').disabled = false;
            document.getElementById('submitFeedback').disabled = false;

        } catch (error) {
            console.error('Error fetching reviews:', error);
            document.getElementById('errorMessage').innerText = error.message; // Display error message
            document.getElementById('errorMessage').style.display = 'block'; // Show error message
        } finally {
            document.getElementById('loading').style.display = 'none'; // Hide loading
        }
    });

    // Event listener for submitting feedback
    document.getElementById('submitFeedback').addEventListener('click', async () => {
        const feedbackInput = document.getElementById('feedbackInput').value;
        const reviewText = "Sample review text"; // Replace with actual review text
        const prediction = "fake"; // Replace with actual prediction

        try {
            const response = await fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}` // Include the JWT token
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

    // Function to handle site selection
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

    // Initialize site selection
    handleSiteSelection();

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "scanReviews") {
            fetchReviewsFromSite(request.site); // Pass the selected site
            sendResponse({ message: "Scanning for fake reviews..." });
        }
    });

    // Function to fetch reviews based on the site
    function fetchReviewsFromSite(site) {
        // Show loading indicator
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
            const reviewText = review.innerText; // Get the inner text
            sendReviewForPrediction(reviewText);
        });

        // Hide loading indicator after processing
        hideLoadingIndicator();
    }

    // Function to show loading indicator
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

    // Function to hide loading indicator
    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // Function to send review text to the backend for prediction
    function sendReviewForPrediction(reviewText) {
        fetch('https://your-server-domain.com/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ review_text: reviewText })  // Adjust the body to match the expected input
        })
        .then(response => response.json())
        .then(data => {
            console.log('Prediction:', data.prediction);  // Log the prediction
            alert(`Prediction: ${data.prediction}\nMessage: ${data.message}`); // User feedback
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the prediction. Please try again.');
        });
    }

    // Function to display reviews and their analysis results
    function displayReviews(analysisResults) {
        const reviewsContainer = document.getElementById('reviewsContainer');
        reviewsContainer.innerHTML = ''; // Clear previous results

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

        // Add event listeners for report buttons
        document.querySelectorAll('.reportButton').forEach(button => {
            button.addEventListener('click', () => {
                const reviewText = button.getAttribute('data-review-text');
                reportReview(reviewText);
            });
        });
    }

    // Function to report a review
    async function reportReview(reviewText) {
        try {
            const response = await fetch('/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}` // Include the JWT token
                },
                body: JSON.stringify({ review_text: reviewText }),
            });

            if (!response.ok) {
                throw new Error('Error reporting review: ' + response.statusText);
            }

            const result = await response.json();
            alert(result.message); // Notify user of the result
        } catch (error) {
            console.error('Error reporting review:', error);
            alert('An error occurred while reporting the review. Please try again.');
        }
    }
