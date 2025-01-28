// Variables for brush properties
let brushColor;
let brushSize = 10;
let erasing = false;
let symmetry = false;
let autoScribbler = false;
let gridEnabled = false;

// Sliders for dynamic brush color adjustment
let sliderR, sliderG, sliderB;

function setup() {
  createCanvas(800, 600);
  background(220);

  // Initial brush color
  brushColor = color(0);

  // Create sliders for color adjustment
  sliderR = createSlider(0, 255, 0); // Red
  sliderR.position(10, 10);
  sliderG = createSlider(0, 255, 0); // Green
  sliderG.position(10, 40);
  sliderB = createSlider(0, 255, 0); // Blue
  sliderB.position(10, 70);
}

function draw() {
  // Update brush color dynamically based on slider values
  brushColor = color(sliderR.value(), sliderG.value(), sliderB.value());

  // Draw grid if enabled
  if (gridEnabled) {
    drawGrid();
  }

  // Handle auto-scribbler
  if (autoScribbler) {
    stroke(brushColor);
    strokeWeight(brushSize);
    let offsetX = random(-5, 5);
    let offsetY = random(-5, 5);
    line(mouseX, mouseY, mouseX + offsetX, mouseY + offsetY);
  }

  // Handle drawing or erasing
  if (mouseIsPressed) {
    if (erasing) {
      stroke(220); // Background color
    } else {
      stroke(brushColor);
    }
    strokeWeight(brushSize);
    line(pmouseX, pmouseY, mouseX, mouseY);

    if (symmetry) {
      line(width - pmouseX, pmouseY, width - mouseX, mouseY);
    }
  }

  // Display brush color on the canvas (top-right corner)
  displayBrushColor();

  // Display instructions at the bottom
  displayInstructions();
}

// Key commands to modify behavior
function keyPressed() {
  if (key === 'E') erasing = !erasing; // Toggle eraser
  if (key === 'S') saveCanvas('example', 'jpg'); // Save image
  if (key === 'R') background(220); // Reset canvas
  if (key === 'T') symmetry = !symmetry; // Toggle symmetry
  if (key === 'A') autoScribbler = !autoScribbler; // Toggle auto-scribbler
  if (key === 'G') gridEnabled = !gridEnabled; // Toggle grid
}

// Adjust brush size with mouse wheel
function mouseWheel(event) {
  brushSize = constrain(brushSize - event.delta / 100, 1, 50);
}

// Draw grid on the canvas
function drawGrid() {
  stroke(200);
  strokeWeight(1);
  for (let x = 0; x < width; x += 50) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 50) {
    line(0, y, width, y);
  }
}

// Display the current brush color in the top-right corner
function displayBrushColor() {
  fill(255, 255, 255, 200); // Semi-transparent white background
  noStroke();
  rect(width - 70, 10, 60, 40); // Background rectangle for brush color
  fill(brushColor);
  rect(width - 65, 15, 50, 30); // Display current brush color
}

// Display instructions at the bottom of the canvas
function displayInstructions() {
  fill(0);
  noStroke();
  rect(0, height - 50, width, 50); // Black background for the instruction bar
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(
    'Keys: E (Eraser/Brush), S (Save), R (Reset), T (Symmetry), A (Auto-Scribbler), G (Toggle Grid), MW: Adjust Brush Size',
    10,
    height - 25
  );
}
