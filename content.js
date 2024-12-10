function highlightReviews(reviews) {
    reviews.forEach(review => {
        const reviewElement = document.querySelector(`#review-${review.id}`);
        if (reviewElement) {
            reviewElement.style.border = `2px solid ${review.color}`;
            reviewElement.title = review.reason;
            reviewElement.classList.add(review.classification);

            reviewElement.addEventListener('mouseover', () => {
                chrome.runtime.sendMessage({action: "explain", review_text: review.text}, (response) => {
                    console.log(response.explanation);
                });
            });
        }
    });
}

function fetchReviews() {
    const reviews = []; 
    chrome.runtime.sendMessage({action: "analyze", reviews: reviews});
}

fetchReviews(); 
