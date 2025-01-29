// script.js

// Define page navigation
// You can keep full paths if needed (e.g. "slides/week01/page01.html"),
// but for simplicity let's assume the files are in the same folder.
const pages = [
    "index.html",             // Index page
    "page01.html",            // Page 01
    "page02.html"             // Page 02
  ];
  
  let currentPage = 0;
  
  // Navigate to the next page
  function nextPage() {
    if (currentPage < pages.length - 1) {
      currentPage++;
      window.location.href = pages[currentPage];
    }
  }
  
  // Navigate to the previous page
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
  
  // Auto-detect which page we are on and update currentPage accordingly
  (function() {
    // Extract the file name from the current URL
    const currentFile = window.location.href.split("/").pop();
    // Check if this file name exists in our pages array
    const idx = pages.indexOf(currentFile);
    // If found, set currentPage to that index
    if (idx >= 0) {
      currentPage = idx;
    }
  })();