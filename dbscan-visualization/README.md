# DBSCAN Algorithm Visualization

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-green?style=plastic&logo=vercel)](https://learning-tools-peach.vercel.app/)

An interactive web-based visualization tool for the DBSCAN (Density-Based Spatial Clustering of Applications with Noise) clustering algorithm. This project helps users understand how DBSCAN works by providing a step-by-step visual representation of the clustering process.

[![DBSCAN Visualization](img/preview.png)](https://learning-tools-peach.vercel.app/)

## 🚀 Features

- **Interactive Visualization**: Watch the DBSCAN algorithm work in real-time
- **Adjustable Parameters**:
  - Number of Points (50-500)
  - Epsilon (ε) radius (20-100)
  - Minimum Points (2-10)
- **Play/Pause Control**: Stop and resume the algorithm at any point
- **Color-Coded States**:
  - White: Initial unprocessed points
  - Yellow: Currently processing point
  - Red: Core points
  - Cluster Colors: Points assigned to clusters
  - Gray: Noise points
- **Responsive Design**: Works on different screen sizes
- **Real-time Parameter Updates**: Instantly see how parameter changes affect the clustering

## ⚙️ Algorithm Implementation

The visualization follows the three main steps of DBSCAN:

1. **Core Point Identification**
   - Finds points with sufficient neighbors within ε radius
   - Marks them as core points (red)

2. **Cluster Formation**
   - Connects core points that are within ε distance
   - Forms clusters through density connectivity

3. **Border Point Assignment**
   - Assigns non-core points to nearby clusters
   - Marks isolated points as noise

## 📁 Project Structure

```
dbscan-visualization/
│
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Custom styles
├── js/
│   └── script.js       # DBSCAN implementation and visualization logic
└── img/
    └── preview.png     # Project preview image
```

## 🔧 Setup

1. Clone the repository:
```bash
git clone --branch dbscan-visualization --single-branch https://github.com/gussttaav/learning-tools.git
```

2. Navigate to the project directory:
```bash
cd dbscan-visualization
```

3. Open `index.html` in a web browser.

## 🛠️ Dependencies

- Bootstrap 5.3.0 (via CDN)
- Modern web browser with HTML5 Canvas support

## ▶️ Usage

1. Adjust the parameters using the sliders:
   - **Number of Points**: Controls the dataset size
   - **Epsilon (ε)**: Sets the neighborhood radius
   - **Min Points**: Defines the minimum neighbors for core points

2. Use the control buttons:
   - **Start Algorithm**: Begins the visualization
   - **Pause**: Temporarily stops the visualization
   - **Continue**: Resumes from the current state
   - **Reset**: Generates a new point dataset

3. Watch the visualization:
   - The algorithm will process points step by step
   - Each phase is color-coded for clarity
   - The ε-neighborhood is shown as a circle around the current point

## 🌐 Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

Contributions are welcome! If you'd like to suggest improvements, feel free to open an issue or submit a pull request.

## 🏆 Acknowledgments

- Implementation inspired by the original DBSCAN algorithm by Martin Ester, Hans-Peter Kriegel, Jörg Sander, and Xiaowei Xu
- Bootstrap for the UI components
- Canvas API for visualization