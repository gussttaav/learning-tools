// Initial setup for X, Y, and Alpha sliders and values
const xSlider = document.getElementById('x-slider');
const ySlider = document.getElementById('y-slider');
const alphaSlider = document.getElementById('alpha-slider');

const xValue = document.getElementById('x-value');
const yValue = document.getElementById('y-value');
const alphaValue = document.getElementById('alpha-value');

xSlider.addEventListener('input', () => {
    xValue.textContent = `X: ${xSlider.value}`;
    updatePlot();
});

ySlider.addEventListener('input', () => {
    yValue.textContent = `Y: ${ySlider.value}`;
    updatePlot();
});

alphaSlider.addEventListener('input', () => {
    alphaValue.textContent = `Alpha: ${alphaSlider.value}`;
});

// Function to calculate the 3D function values
function func(x, y) {
    return (x**4 - 5 * x**3 + 7 * x**2 - 3 * x) + (y**2 - 2 * y);
}

// Generate the grid for the surface plot
let xRange = [];
let zRange = [];

for (let i = -0.2; i <= 2.85; i += 0.03) {
    xRange.push(i);
}

for (let j = -0.5; j <= 2.5; j += 0.03) {
    zRange.push(j);
}

let X = [];
let Y = [];
let Z = [];

for (let i = 0; i < xRange.length; i++) {
    X.push([]);
    Z.push([]);
    for (let j = 0; j < zRange.length; j++) {
        X[i].push(xRange[i]);
        Z[i].push(func(xRange[i], zRange[j]));
    }
}

for (let i = 0; i < xRange.length; i++) {
    Y.push([]);
    for (let j = 0; j < zRange.length; j++) {
        Y[i].push(zRange[j]);
    }
}

// Plotly data for the surface
const surfaceData = [{
    type: 'surface',
    x: X,
    y: Y,
    z: Z,
    colorscale: 'Viridis',
    opacity: 0.85,
    showscale: false
}];

// Layout for the plot
const layout = {
    scene: {
        xaxis: {
            title: 'x',
            titlefont: { color: '#18d26e' },
            tickfont: { color: '#18d26e' },
            gridcolor: '#18d26e',
            gridwidth: 0.5,
            showgrid: true,
            zeroline: false,
            griddash: 'dash'
        },
        yaxis: {
            title: 'y',
            titlefont: { color: '#18d26e' },
            tickfont: { color: '#18d26e' },
            gridcolor: '#18d26e',
            gridwidth: 0.5,
            showgrid: true,
            zeroline: false,
            griddash: 'dash'
        },
        zaxis: {
            title: 'f(x, y)',
            titlefont: { color: '#18d26e' },
            tickfont: { color: '#18d26e' },
            gridcolor: '#18d26e',
            gridwidth: 0.5,
            showgrid: true,
            zeroline: false,
            griddash: 'dash'
        },
        aspectmode: 'cube',
        camera: {
            eye: { x: 1.25, y: -1.9, z: 1.25 }, // Starting position for the camera
            up: { x: 0, y: 0, z: 1 }           // Keep z-axis as the up direction
        }
    },
    paper_bgcolor: 'black',
    plot_bgcolor: 'black',
    font: { color: '#18d26e' },
    margin: { l: 0, r: 0, t: 0, b: 0 }
};

// Function to update the plot with the current initial point
function updatePlot() {
    const initialX = parseFloat(xSlider.value);
    const initialZ = parseFloat(ySlider.value);
    
    // Clear previous plot and re-plot the surface and initial point
    Plotly.react('plotly-3d', [...surfaceData, {
        type: 'scatter3d',
        mode: 'markers',
        x: [initialX],
        y: [initialZ],
        z: [func(initialX, initialZ)],
        marker: { color: 'yellow', size: 3 },
        showlegend: false
    }], layout);
}

// Gradient Descent function
function gradientDescent(xStart, zStart, alpha, threshold = 0.0001) {
    let x = xStart;
    let z = zStart;
    let prevValue = func(x, z);
    let stepCount = 0;
    let steps = [];
    const maxSteps = 100;

    while (stepCount < maxSteps) {
        let dfdx = 4 * x**3 - 15 * x**2 + 14 * x - 3;
        let dfdz = 2 * z - 2;

        x = x - alpha * dfdx;
        z = z - alpha * dfdz;

        let newValue = func(x, z);
        steps.push({ x, z, value: newValue });

        if (Math.abs(newValue - prevValue) < threshold) {
            break;
        }

        prevValue = newValue;
        stepCount++;
    }

    return steps;
}

let interval;
let isSimulating = false;

// Start the Gradient Descent process
document.getElementById('start-button').addEventListener('click', () => {
    const button = document.getElementById('start-button');

    if (isSimulating) {
        // If already simulating, stop the simulation
        clearInterval(interval);
        isSimulating = false;
        button.textContent = 'Start Simulation';  // Change button text back
    } else {
        // If not simulating, start the simulation
        isSimulating = true;
        button.textContent = 'Stop Simulation';

        let xStart = parseFloat(xSlider.value);
        let zStart = parseFloat(ySlider.value);
        let alpha = parseFloat(alphaSlider.value);

        // Clear all traces except the surface plot
        const traceCount = document.getElementById('plotly-3d').data.length;
        if (traceCount > 1) {
            // Delete all traces except the surface plot at index 0
            Plotly.deleteTraces('plotly-3d', [...Array(traceCount - 1).keys()].map(i => i + 1));
        }

        // Get the steps of the gradient descent
        const steps = gradientDescent(xStart, zStart, alpha);
        steps.unshift({ x: xStart, z: zStart, value: func(xStart, zStart) });

        // Simulate the steps and plot them
        let index = 0;
        interval = setInterval(() => {
            if (index >= steps.length || !isSimulating) {
                clearInterval(interval);
                isSimulating = false;
                button.textContent = 'Start Simulation';
                return;
            }

            const step = steps[index];
            Plotly.extendTraces('plotly-3d', {
                x: [[step.x]],
                y: [[step.z]],
                z: [[step.value]]
            }, [0]);

            // Draw the line connecting to the previous point, with markers at each point
            if (index > 0) {
                const prevStep = steps[index - 1];
                Plotly.addTraces('plotly-3d', [{
                    type: 'scatter3d',
                    mode: 'lines+markers',
                    x: [prevStep.x, step.x],
                    y: [prevStep.z, step.z],
                    z: [prevStep.value, step.value],
                    line: { color: 'yellow', width: 3 },
                    marker: { color: 'yellow', size: 3 },
                    showlegend: false
                }]);
            }

            index++;
        }, 500); // Update every 500ms
    }
});

// Initial plot to render the surface
Plotly.newPlot('plotly-3d', surfaceData, layout);
updatePlot();