# Khet 2.0 – Three.js Frontend

## Team
**Team Name:** FinalMove

**Members:**
- Farouk Ben Taleb
- Oussema Mefteh

---

## Installation

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository:**
```bash
   git clone https://github.com/FaroukBentaleb/Khet2.0--ThreeJS.git
   cd Khet2.0
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Start the development server:**
```bash
   npm run dev
```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:PORT`

---

## Implemented Features

### Game Mechanics
- **Full Khet 2.0 board** implemented in Three.js with a 10×10 grid

### User Interface
- **3D board visualization** with clear grid lines (10×10 squares)
- **Interactive camera controls:**
  - Orbit controls for rotating the view around the board
  - Zoom in/out functionality
- **Minimal design**
- **Visual piece differentiation** through unique colors and sizes

---

## Front-End Architecture

### Application Structure
- **Type:** Single-page application
- **Main Game Page:** Contains the 3D board and game controls

### Components

**Core Components:**
- **Board Component** - Renders the 10×10 game grid in Three.js
- **Piece Components** - Individual components for each piece type (Pharaoh, Sphinx, Scarab, Anubis, Pyramid)
- **Camera Controller** - Manages orbit controls and camera positioning

---

## Technologies Used
- **Three.js** - 3D rendering and game visualization
- **JavaScript** - Game logic and interactions
- **HTML/CSS** - Basic structure and styling

---

## Project Structure
```
Khet2.0/
├── public/
├── src/
│   ├── pieces/
│       └── Anubis.js
│       └── Pharaoh.js
│       └── Pyramid.js
│       └── Scarab.js
│       └── Sphinx.js
│   └── khet.js
│   └── main.js
├── index.html
├── package.json
└── README.md
```

---

## Contact
For questions or contributions, please contact:
- Farouk Ben Taleb - [email]
- [Member 2] - [email]
- [Member 3] - [email]