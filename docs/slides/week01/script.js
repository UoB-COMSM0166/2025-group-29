// Define page navigation
const pages = [
    "index.html", // Current page
    "slides/week01/page01.html", // Next page
    "slides/week01/page02.html"  // Another page
];

let currentPage = 0;

// Navigate to next page
function nextPage() {
    if (currentPage < pages.length - 1) {
        currentPage++;
        window.location.href = pages[currentPage];
    }
}

// Navigate to previous page
function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        window.location.href = pages[currentPage];
    }
}

// Handle button visibility based on cursor movement
document.addEventListener("mousemove", function(event) {
    const leftButton = document.getElementById("prevPage");
    const rightButton = document.getElementById("nextPage");

    // Get cursor position
    const x = event.clientX;
    const screenWidth = window.innerWidth;

    // Show left button when near left edge
    leftButton.style.opacity = x < screenWidth * 0.15 ? "1" : "0.2";

    // Show right button when near right edge
    rightButton.style.opacity = x > screenWidth * 0.85 ? "1" : "0.2";
});

// Attach click events to buttons
document.getElementById("nextPage").addEventListener("click", nextPage);
document.getElementById("prevPage").addEventListener("click", prevPage);