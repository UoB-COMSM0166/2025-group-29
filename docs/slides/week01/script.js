const numPages = 10;
const pages = ["index.html"];
for (let i = 1; i < numPages; i++) {
  const numStr = i.toString().padStart(2, '0');
  pages.push(`page${numStr}.html`);
}
let currentPage = 0;
function nextPage() {
  if (currentPage < pages.length - 1) {
    currentPage++;
    window.location.href = pages[currentPage];
  }
}
function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    window.location.href = pages[currentPage];
  }
}
document.addEventListener("mousemove", function(event) {
  const leftButton = document.getElementById("prevPage");
  const rightButton = document.getElementById("nextPage");
  const x = event.clientX;
  const screenWidth = window.innerWidth;
  leftButton.style.opacity = x < screenWidth * 0.15 ? "1" : "0.2";
  rightButton.style.opacity = x > screenWidth * 0.85 ? "1" : "0.2";
});
document.getElementById("nextPage").addEventListener("click", nextPage);
document.getElementById("prevPage").addEventListener("click", prevPage);
(function() {
  const currentFile = window.location.href.split("/").pop();
  const idx = pages.indexOf(currentFile);
  if (idx >= 0) {
    currentPage = idx;
  }
})();