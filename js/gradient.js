const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startValueSlider = document.getElementById('start-value');
const alphaSlider = document.getElementById('alpha');
const startButton = document.getElementById('start-button');
const startValueLabel = document.getElementById('start-value-label');
const alphaLabel = document.getElementById('alpha-label');

const threshold = 0.0001; // Convergence threshold

//x-axis range and ticks separation distance
const minX = -0.2;
const maxX = 3.3;
const tickXstep = 0.5;

//y-axis range and ticks separation distance
const minY = -3.1;
const maxY = 1.6;
const tickYstep = 0.5;

//simulation step time interval in milliseconds
simStepTime = 500

let intervalId = null;
let isSimulating = false;

// Function to calculate y = x^4 - 5*x^3 + 7*x^2 - 3*x
function f(x) {
  return x**4 - 5*x**3 + 7*x**2 - 3*x;
}

// Derivative of the function, for gradient descent steps
function f_prime(x) {
  return 4*x**3 - 15*x**2 + 14*x - 3;
}

// Scale coordinates from function space to canvas space
function scaleX(x) {
  return (x - minX) / maxX * canvas.width;
}
function scaleY(y) {
  return canvas.height - ((y - minY) / (maxY - minY)) * canvas.height;
}

// Draw the function plot, axes, and initial point
function drawFunction(initialX) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw coordinate axes with ticks and labels
  drawAxes();

  // Draw the function in red
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  for (let x = minX; x <= maxX; x += 0.01) {
    const canvasX = scaleX(x);
    const canvasY = scaleY(f(x));
    if (x === minX) {
      ctx.moveTo(canvasX, canvasY);
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }
  ctx.stroke();

  // Draw the initial point
  drawPoint(initialX, f(initialX));
}

// Draw the coordinate axes with ticks and labels at intervals of 0.5
function drawAxes() {
  ctx.strokeStyle = '#0D3512';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#18d26e';
  ctx.font = '12px Arial';

  // Draw x-axis
  ctx.beginPath();
  ctx.moveTo(0, scaleY(0));
  ctx.lineTo(canvas.width, scaleY(0));
  ctx.stroke();

  // Draw y-axis
  ctx.beginPath();
  ctx.moveTo(scaleX(0), 0);
  ctx.lineTo(scaleX(0), canvas.height);
  ctx.stroke();

  // Draw x-axis ticks and labels
  const fstXtick = Math.ceil(minX / tickXstep) * tickXstep; 
  const lastXtick = Math.floor(maxX / tickXstep) * tickXstep;
  for (let x = fstXtick; x <= lastXtick; x += tickXstep) {
    if(x !== 0){
      const tickX = scaleX(x);
      ctx.beginPath();
      ctx.moveTo(tickX, scaleY(0) - 5);
      ctx.lineTo(tickX, scaleY(0) + 5);
      ctx.stroke();

      // Draw x-axis label
      ctx.fillText(x.toFixed(1), tickX - 10, scaleY(0) + 20);
    }
  }

  // Draw y-axis ticks and labels
  const fstYtick = Math.ceil(minY / tickYstep) * tickYstep; 
  const lastYtick = Math.floor(maxY / tickYstep) * tickYstep;
  for (let y = fstYtick; y <= lastYtick; y += tickYstep) {
    const tickY = scaleY(y);
    ctx.beginPath();
    ctx.moveTo(scaleX(0) - 5, tickY);
    ctx.lineTo(scaleX(0) + 5, tickY);
    ctx.stroke();

    // Draw y-axis label, adjusting the horizontal position based on the sign
    ctx.fillText(y.toFixed(1), scaleX(0) - 30, tickY + 5);
  }
}

// Draw a point at (x, y) on the function, represented by a filled yellow circle
function drawPoint(x, y) {
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(scaleX(x), scaleY(y), 5, 0, 2 * Math.PI);
  ctx.fill();
}

// Start gradient descent simulation
function startGradientDescent() {

  isSimulating = true;
  startButton.textContent = 'Stop Gradient Descent';

  let x = parseFloat(startValueSlider.value);
  const alpha = parseFloat(alphaSlider.value);
  let prevX = null;
  let prevY = null;

  // Stop any previous running gradient descent
  clearInterval(intervalId);

  intervalId = setInterval(() => {
    const y = f(x);
    drawStep(x, y, prevX, prevY);

    // Update previous position
    prevX = x;
    prevY = y;

    // Update x using gradient descent
    const gradient = f_prime(x);
    x -= alpha * gradient;

    // Check for convergence
    if (Math.abs(f(x) - y) < threshold || !isSimulating) {
      clearInterval(intervalId);
      isSimulating = false;
      startButton.textContent = 'Start Gradient Descent'; // Reset button text
      return;
    }
  }, simStepTime);
}

// Draw a step in the gradient descent process, with an arrow to the next step
function drawStep(x, y, prevX, prevY) {
  ctx.strokeStyle = 'yellow';
  ctx.fillStyle = 'yellow';
  ctx.lineWidth = 2;

  // Draw line from previous point to the current point
  if (prevX !== null && prevY !== null) {
    ctx.beginPath();
    ctx.moveTo(scaleX(prevX), scaleY(prevY));
    ctx.lineTo(scaleX(x), scaleY(y));
    ctx.stroke();
  }

  // Draw the point as a filled circle
  ctx.beginPath();
  ctx.arc(scaleX(x), scaleY(y), 5, 0, 2 * Math.PI);
  ctx.fill();
}

// Event listeners for slider updates and button click
startValueSlider.addEventListener('input', () => {
  const initialX = parseFloat(startValueSlider.value);
  startValueLabel.textContent = initialX.toFixed(2);
  drawFunction(initialX); // Update graph with new initial value point
});
alphaSlider.addEventListener('input', () => {
  alphaLabel.textContent = parseFloat(alphaSlider.value).toFixed(3);
});
startButton.addEventListener('click', () => {
  if (isSimulating) {
    // If already simulating, stop the simulation
    clearInterval(intervalId);
    isSimulating = false;
    startButton.textContent = 'Start Gradient Descent';
  } 
  else {
    drawFunction(parseFloat(startValueSlider.value));
    startGradientDescent();
  }
});

// Initial draw of the function and initial point
drawFunction(parseFloat(startValueSlider.value));
