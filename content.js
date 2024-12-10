// Function to highlight reviews based on analysis results
function highlightReviews(reviews) {
    reviews.forEach(review => {
        const reviewElement = document.querySelector(`#review-${review.id}`);
        if (reviewElement) {
            reviewElement.style.border = `2px solid ${review.color}`;
            reviewElement.title = review.reason;
            reviewElement.classList.add(review.classification);

            // Add hover event to show explanation
            reviewElement.addEventListener('mouseover', () => {
                // Call the explanation function (you may need to adjust this part)
                chrome.runtime.sendMessage({action: "explain", review_text: review.text}, (response) => {
                    // Show explanation in a tooltip or console
                    console.log(response.explanation);
                });
            });
        }
    });
}

// Fetch reviews and send them for analysis
function fetchReviews() {
    const reviews = []; // Logic to collect reviews from the page
    // Send reviews to background script or ML model for analysis
    chrome.runtime.sendMessage({action: "analyze", reviews: reviews});
}

// Call fetchReviews when the content script loads
fetchReviews(); 