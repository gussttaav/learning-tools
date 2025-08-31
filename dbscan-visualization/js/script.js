class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.cluster = -1; // -1: unvisited, -2: noise
        this.isCore = false;
        this.visited = false;
        this.color = 'white';
        this.neighbors = []; // Store neighbors for reuse
    }
}

class DBSCANVisualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.animationTimer = null;
        this.epsilon = 60;
        this.minPoints = 4;
        this.totalPoints = 100;
        this.clusterColors = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#34495e', '#1abc9c'];
        this.pointRadius = 0;
        this.simulationState = 'stopped'; // possible states: 'stopped', 'running', 'paused'
        this.startBtn = null;

        // Base values for reference canvas size (e.g., for a 800x400 canvas)
        this.baseWidth = 800;
        this.baseHeight = 430;
        this.basePointRadius = 4; // Base radius in pixels for reference size
        this.baseMinDistance = 12; // Base minimum distance between points

        // Add state tracking for algorithm steps
        this.algorithmStep = 0; // 0: core points, 1: connected components, 2: non-core points
        this.stepIndex = 0; // Index within current step
        this.isProcessing = false; // Flag to track if we're in the middle of processing
        this.processingQueue = []; // Queue for connected components step

        // UI elements for step tracking
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        
        this.setupCanvas();
        this.setupControls();
        
        // Generate and show initial points
        this.makeBlobs();
        this.drawCurrentState();
        this.updateProgress();

        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    updateProgress() {
        let progress = 0;
        let progressText = 'Ready to start';

        if (this.simulationState === 'running') {
            switch (this.algorithmStep) {
                case 0: // Core point identification
                    progress = (this.stepIndex / this.points.length) * 33.33;
                    progressText = `Identifying core points... (${this.stepIndex}/${this.points.length})`;
                    break;
                case 1: // Cluster formation
                    const totalClusters = this.points.filter(p => p.isCore && p.cluster === -1).length + this.stepIndex;
                    progress = 33.33 + (this.stepIndex / Math.max(totalClusters, 1)) * 33.33;
                    progressText = `Forming clusters... (${this.stepIndex} clusters formed)`;
                    break;
                case 2: // Non-core assignment
                    const nonCorePoints = this.points.filter(p => !p.isCore).length;
                    const processedNonCore = Math.min(this.stepIndex, nonCorePoints);
                    progress = 66.66 + (processedNonCore / Math.max(nonCorePoints, 1)) * 33.34;
                    progressText = `Assigning border points... (${processedNonCore}/${nonCorePoints})`;
                    break;
            }
        } else if (this.simulationState === 'stopped') {
            if (this.points.some(p => p.cluster !== -1)) {
                progress = 100;
                progressText = 'Algorithm completed!';
            } else {
                progress = 0;
                progressText = 'Ready to start';
            }
        } else if (this.simulationState === 'paused') {
            progressText = 'Algorithm paused...';
        }

        this.progressBar.style.width = `${Math.min(progress, 100)}%`;
        this.progressText.textContent = progressText;
    }

    handleResize() {
        this.setupCanvas();
        if (this.points.length > 0) {
            const oldWidth = this.canvas.width;
            const oldHeight = this.canvas.height;
            const scaleX = this.canvas.width / oldWidth;
            const scaleY = this.canvas.height / oldHeight;
            
            this.points.forEach(point => {
                point.x *= scaleX;
                point.y *= scaleY;
            });
            
            this.drawCurrentState();
        }
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Remove inline styles
        this.canvas.style.removeProperty('width');
        this.canvas.style.removeProperty('height');
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = 430 * dpr;
        
        this.ctx.scale(dpr, dpr);

        // Calculate scaling factor based on canvas area ratio
        const currentArea = (this.canvas.width/dpr) * (this.canvas.height/dpr);
        const baseArea = this.baseWidth * this.baseHeight;
        const scaleFactor = Math.sqrt(currentArea / baseArea);

        // Scale point radius and minimum distance
        this.pointRadius = this.basePointRadius * scaleFactor;
        this.minDistance = this.baseMinDistance * scaleFactor;
        
        // Scale epsilon based on canvas size but with a minimum value
        const baseEpsilon = Math.min(this.canvas.width/dpr, this.canvas.height/dpr) / 20;
        this.epsilon = Math.max(baseEpsilon * scaleFactor, this.minDistance * 2);
        
        document.getElementById('epsilon').value = this.epsilon;
        document.getElementById('epsilonValue').textContent = Math.round(this.epsilon);
    }

    setupControls() {
        const totalPointsSlider = document.getElementById('numPoints');
        const minPointsSlider = document.getElementById('minPoints');
        const epsilonSlider = document.getElementById('epsilon');
        this.startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');

        totalPointsSlider.addEventListener('input', (e) => {
            this.totalPoints = parseInt(e.target.value);
            document.getElementById('numPointsValue').textContent = this.totalPoints;

            // Generate and show new points if simulation is stopped
            if (this.simulationState === 'stopped') {
                this.makeBlobs();
                this.drawCurrentState();
            }
        });

        minPointsSlider.addEventListener('input', (e) => {
            this.minPoints = parseInt(e.target.value);
            document.getElementById('minPointsValue').textContent = this.minPoints;
        });

        epsilonSlider.addEventListener('input', (e) => {
            this.epsilon = parseInt(e.target.value);
            document.getElementById('epsilonValue').textContent = this.epsilon;

            if (this.simulationState === 'stopped') {
                this.drawCurrentState();
            }
        });

        this.startBtn.addEventListener('click', () => this.handleSimulationControl());
        resetBtn.addEventListener('click', () => this.reset());
    }

    handleSimulationControl() {
        switch (this.simulationState) {
            case 'stopped':
                this.startSimulation();
                break;
            case 'running':
                this.pauseSimulation();
                break;
            case 'paused':
                this.continueSimulation();
                break;
        }
    }

    updateButtonText() {
        switch (this.simulationState) {
            case 'stopped':
                this.startBtn.textContent = 'Start Algorithm';
                break;
            case 'running':
                this.startBtn.textContent = 'Pause Algorithm';
                break;
            case 'paused':
                this.startBtn.textContent = 'Continue Simulation';
                break;
        }
    }

    startSimulation() {
        // Reset clusters but keep points
        this.points.forEach(point => {
            point.cluster = -1;
            point.visited = false;
            point.isCore = false;
            point.color = 'white';
            point.neighbors = [];
        });

        this.algorithmStep = 0;
        this.stepIndex = 0;
        this.processingQueue = [];
        this.isProcessing = false;

        this.simulationState = 'running';
        this.updateButtonText();
        this.updateProgress();
        this.runSimulation();
    }

    pauseSimulation() {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
        this.simulationState = 'paused';
        this.updateButtonText();
        this.updateProgress();
    }

    continueSimulation() {
        this.simulationState = 'running';
        this.updateButtonText();
        this.updateProgress();
        this.runSimulation();
    }

    runSimulation() {
        this.animationTimer = setInterval(() => {
            if (!this.isProcessing) {
                this.processNextStep();
            }
        }, 1000);
    }

    async processNextStep() {
        this.isProcessing = true;

        switch (this.algorithmStep) {
            case 0: // Identify Core Points
                if (this.stepIndex < this.points.length) {
                    await this.processCorePoint(this.stepIndex);
                    this.stepIndex++;
                } else {
                    console.log('Core points identified');
                    this.algorithmStep++;
                    this.stepIndex = 0;
                    // Prepare queue for connected components
                    this.processingQueue = this.points.filter(p => p.isCore && p.cluster === -1);
                    this.updateProgress();
                }
                break;

            case 1: // Identify Connected Components
                while (this.processingQueue.length > 0) {
                    const point = this.processingQueue[0];
                    if (point.cluster === -1) {
                        await this.expandCluster(point, this.stepIndex);
                        this.stepIndex++;
                        this.processingQueue.shift();
                        break;
                    } else {
                        this.processingQueue.shift();
                        continue;
                    }
                }
                
                // Check if we're done with connected components
                if (this.processingQueue.length === 0) {
                    console.log('Connected components identified');
                    this.algorithmStep++;
                    this.stepIndex = 0;
                    this.processingQueue = this.points.filter(p => !p.isCore && p.cluster === -1);
                    this.updateProgress();
                }
                break;

            case 2: // Assign Non-Core Points
                while (this.stepIndex < this.points.length
                       && (this.points[this.stepIndex].isCore || 
                           this.points[this.stepIndex].cluster !== -1)) {
                    this.stepIndex++;
                }

                if (this.stepIndex < this.points.length) {
                    await this.processNonCorePoint(this.points[this.stepIndex]);
                    this.stepIndex++;
                } else {
                    console.log('Non-core points assigned');
                    // Algorithm completed
                    this.finishSimulation();
                }
                break;
        }

        this.updateProgress();
        this.isProcessing = false;
    }

    async processCorePoint(index) {
        const point = this.points[index];
        
        // Highlight current point
        point.color = '#f1c40f'; // Yellow for processing
        this.drawCurrentState();
        await this.delay(300);
        
        // Find and store neighbors
        point.neighbors = this.getNeighbors(point);
        
        // Determine if it's a core point
        if (point.neighbors.length >= this.minPoints) {
            point.isCore = true;
            point.color = '#e74c3c'; // Red for core points
        } else {
            point.isCore = false;
            point.color = 'white'; // Back to white if not core
        }
        
        this.drawCurrentState();
    }

    async expandCluster(startPoint, clusterId) {
        const stack = [startPoint];
        const clusterColor = this.clusterColors[clusterId % this.clusterColors.length];
        
        while (stack.length > 0) {
            const point = stack.pop();
            
            if (point.cluster === -1) {
                point.cluster = clusterId;
                point.color = clusterColor;
                this.drawCurrentState();
                await this.delay(300);
                
                // Add core neighbors to stack
                for (const neighbor of point.neighbors) {
                    if (neighbor.isCore && neighbor.cluster === -1) {
                        stack.push(neighbor);
                    }
                }
            }
        }
    }

    async processNonCorePoint(point) {
        // Highlight current non-core point
        point.color = '#f1c40f'; // Yellow for processing
        this.drawCurrentState();
        await this.delay(300);
        
        let assigned = false;
        let minDistance = Infinity;
        let nearestCorePoint = null;
        
        // Find nearest core point within epsilon
        for (const potentialCore of this.points) {
            if (!potentialCore.isCore) continue;
            
            const distance = this.getDistance(point, potentialCore);
            if (distance <= this.epsilon && distance < minDistance) {
                minDistance = distance;
                nearestCorePoint = potentialCore;
                assigned = true;
            }
        }
        
        if (assigned) {
            point.cluster = nearestCorePoint.cluster;
            point.color = nearestCorePoint.color;
        } else {
            point.cluster = -2;
            point.color = '#7f8c8d'; // Gray for noise
        }
        
        this.drawCurrentState();
    }

    finishSimulation() {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
        this.simulationState = 'stopped';
        this.updateButtonText();
        this.updateProgress();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Check if a point overlaps with existing points
    checkOverlap(x, y, existingPoints) {
        return existingPoints.some(point => {
            const dx = point.x - x;
            const dy = point.y - y;
            return Math.sqrt(dx * dx + dy * dy) < this.minDistance;
        });
    }

    // Generate a point with normal distribution that doesn't overlap
    generateNonOverlappingPoint(center, std, existingPoints, bounds) {
        const maxAttempts = 100;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // Box-Muller transform for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
            
            const x = center.x + z1 * std;
            const y = center.y + z2 * std;
            
            // Check if point is within bounds and doesn't overlap
            if (x >= bounds.minX && x <= bounds.maxX && 
                y >= bounds.minY && y <= bounds.maxY && 
                !this.checkOverlap(x, y, existingPoints)) {
                return new Point(x, y);
            }
            
            attempts++;
        }
        
        return null; // Return null if no valid position found
    }

    makeBlobs() {
        this.points = [];
        
        // Calculate dimensions based on current canvas size
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = this.canvas.width / dpr;
        const canvasHeight = this.canvas.height / dpr;
        
        // Scale margin based on canvas size
        const margin = Math.min(canvasWidth, canvasHeight) * 0.05;
        const usableWidth = canvasWidth - (2 * margin);
        const usableHeight = canvasHeight - (2 * margin);
        
        // Calculate cluster centers
        const centerY = canvasHeight / 2;
        const cluster1X = margin + usableWidth * 0.30;
        const cluster2X = margin + usableWidth * 0.60;
        
        const centers = [
            { x: cluster1X, y: centerY },
            { x: cluster2X, y: centerY }
        ];

        // Adjust number of points based on available area
        const availableArea = usableWidth * usableHeight;
        const baseArea = (this.baseWidth - 2 * (this.baseWidth * 0.15)) * 
                        (this.baseHeight - 2 * (this.baseHeight * 0.15));
        const areaRatio = availableArea / baseArea;
        
        // Adjust requested points if needed
        const adjustedTotalPoints = Math.min(
            this.totalPoints,
            Math.floor(this.totalPoints * areaRatio * 1.2) // 1.2 as buffer
        );

        // Calculate points per cluster
        const pointsCluster1 = Math.floor(Math.random() * (adjustedTotalPoints - 10)) + 5;
        const pointsCluster2 = adjustedTotalPoints - pointsCluster1;
        const pointsPerCluster = [pointsCluster1, pointsCluster2];

        // Define boundaries
        const bounds = {
            minX: margin,
            maxX: canvasWidth - margin,
            minY: margin,
            maxY: canvasHeight - margin
        };

        const currentStd = [Math.min(usableWidth, usableHeight) * 0.1,
                            Math.min(usableWidth, usableHeight) * 0.16
        ];

        // Generate points for each cluster
        centers.forEach((center, i) => {
            const numPoints = pointsPerCluster[i];
            let pointsGenerated = 0;
            let consecutiveFailures = 0;
            const maxConsecutiveFailures = 50;

            while (pointsGenerated < numPoints && consecutiveFailures < maxConsecutiveFailures) {
                const newPoint = this.generateNonOverlappingPoint(center, currentStd[i], this.points, bounds);
                
                if (newPoint) {
                    this.points.push(newPoint);
                    pointsGenerated++;
                    consecutiveFailures = 0;
                } else {
                    consecutiveFailures++;
                }
            }
        });

        // Log actual points generated vs requested
        if (this.points.length < adjustedTotalPoints) {
            console.log(`Note: Generated ${this.points.length} points out of ${adjustedTotalPoints} requested due to space constraints`);
        }
    }

    drawPoint(point) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.pointRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = point.color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.stroke();
    }

    drawEpsilonCircle(point) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.epsilon, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
        this.ctx.stroke();
    }

    drawCurrentState() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw all points
        this.points.forEach(p => this.drawPoint(p));
        if(this.simulationState === 'stopped') {
            this.drawEpsilonCircle(this.points[0]);
        }
        
        // Updated to use stepIndex instead of currentPointIndex
        if (this.simulationState === 'running') {
            if (this.algorithmStep === 0 && this.stepIndex < this.points.length) {
                // Show epsilon circle during core point identification
                this.drawEpsilonCircle(this.points[this.stepIndex]);
            } else if (this.algorithmStep === 2 && this.stepIndex < this.points.length) {
                // Show epsilon circle during non-core point assignment
                const point = this.points[this.stepIndex];
                if (!point.isCore) {
                    this.drawEpsilonCircle(point);
                }
            }
        }
    }

    getNeighbors(point) {
        return this.points.filter(p => {
            const dx = p.x - point.x;
            const dy = p.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) <= this.epsilon;
        });
    }

    reset() {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentPointIndex = 0;
        this.simulationState = 'stopped';
        this.updateButtonText();
        this.updateProgress();

        // Generate new points and show them immediately
        this.makeBlobs();
        this.drawCurrentState();
    }
}

window.addEventListener('load', () => {
    const visualizer = new DBSCANVisualizer();
});