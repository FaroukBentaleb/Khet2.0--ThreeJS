# Khet 3D - Laser Chess Game

## Project Overview
Khet 3D is a web-based implementation of the strategic board game Khet (also known as Laser Chess), featuring a fully interactive 3D game board with realistic physics and visual effects.

## Team
**Team Name:** FinalMove

**Members:**
- Oussema Mefteh
- Farouk Ben Taleb

## Installation

### Prerequisites
- Modern web browser with WebGL support (Chrome, Firefox, Edge, Safari)
- Internet connection (for loading Three.js libraries)

### Quick Start
1. **Download the project files**
2. **Open `index.html` in a web browser**
3. **No additional installation required!**

### Development Setup
```bash
# Clone repository
git clone https://github.com/FaroukBentaleb/Khet2.0--ThreeJS.git
cd Khet2.0--ThreeJS

# Open in code editor
# Launch with live server extension
npm install
npm run dev

```

## Features Implemented

### Core Game Engine
- **Complete Board Setup**: 10x10 grid with random piece placement
- **Turn-based Gameplay**: Player 1 vs Player 2 alternating turns
- **Piece Movement System**: Orthogonal movement with validation
- **Rotation System**: 90-degree rotations for all pieces
- **Laser Mechanics**: Complete laser path calculation with reflections

### 3D Visualization
- **Interactive 3D Board**: Clickable game pieces with visual feedback
- **Realistic Piece Models**:
  - Sphinx with laser emitter
  - Pharaoh with crown ornament
  - Anubis with shield face
  - Pyramid with diagonal mirrors
  - Scarab with X-shaped mirrors
- **Dynamic Lighting**: Ambient and directional lights with shadows
- **Camera Controls**: Orbit controls for 360° view

### Game Pieces & Abilities

#### 1. Sphinx
- **Function**: Laser emitter
- **Abilities**: Fires laser at end of turn (except when swapped)
- **Special**: Cannot be moved, only rotated
- **Laser Interaction**: All sides are shields

#### 2. Pharaoh
- **Function**: King piece
- **Abilities**: Game ends when destroyed
- **Special**: Cannot be moved, only rotated
- **Laser Interaction**: Vulnerable on all sides

#### 3. Anubis
- **Function**: Shield piece
- **Abilities**: Can move and rotate
- **Special**: Shield on front face only
- **Laser Interaction**: Blocks from front, destroyed from sides/rear

#### 4. Pyramid
- **Function**: Mirror piece
- **Abilities**: Diagonal mirrors on two faces
- **Special**: Can be placed from reserve during game
- **Laser Interaction**: Reflects or gets destroyed

#### 5. Scarab
- **Function**: Special piece
- **Abilities**: X-shaped mirrors on all sides
- **Special**: Indestructible, can swap with Sphinx/Pharaoh
- **Laser Interaction**: Always reflects

### Special Systems

#### Pyramid Placement System
- **Reserve Pyramids**: 7 pyramids per player at start
- **Placement Rules**: Cannot place adjacent to Pharaohs or Sphinxes
- **Visual Indicators**: Highlighted valid placement cells
- **Cooldown System**: Destroyed pyramids go to opponent's reserve after 1 turn

#### Scarab Swap System
- **Swap Targets**: Can swap with Sphinx or Pharaoh
- **Cooldown**: 4 turns between swaps
- **Visual Animation**: Arc movement animation during swap
- **Sphinx Swap Effect**: No laser fire on turn of Sphinx swap

#### Laser System
- **Path Calculation**: Complete laser tracing with max 200 iterations
- **Visual Effects**: Red laser beam with glow effect
- **Destruction Effects**: Particle explosion animations
- **Game Over Detection**: Checks for Pharaoh destruction

### User Interface
- **Game Information Panel**: Turn counter, current player, pyramid reserves
- **Visual Selection**: Highlighted selected pieces with action arrows
- **Action Arrows**:
  - Red arrows for movement (4 directions)
  - Gray arrows for rotation (clockwise/counter-clockwise)
- **Hover Effects**: Interactive feedback on hover
- **Game Over Screen**: Winner announcement with restart button

## Game Rules

### Turn Sequence
1. **Action Phase**: Move or rotate one piece (or place pyramid/swap)
2. **Laser Phase**: Sphinx fires laser (except after Sphinx swap)
3. **Cleanup Phase**: Destroyed pieces removed, cooldowns processed
4. **Switch Phase**: Next player's turn begins

### Movement Rules
- Pieces move one square orthogonally (up/down/left/right)
- Cannot move onto occupied squares
- Sphinx and Pharaoh cannot move (only rotate)

### Victory Conditions
- **Win**: Destroy opponent's Pharaoh
- **Draw**: Both Pharaohs destroyed simultaneously
- **Draw**: 100 turns reached

## Technical Architecture

### Frontend Structure
- **Single HTML Page**: Complete game in one HTML file with modular JavaScript
- **Component-based Design**: Each piece type as separate class
- **Event-driven Interaction**: Mouse click and hover events

### Key Components

#### 1. `KhetGame.js` - Main Controller
- **Responsibilities**: Scene setup, game initialization, UI management
- **Dependencies**: Three.js, OrbitControls, all piece classes

#### 2. `GameEngine.js` - Logic Engine
- **Responsibilities**: Game state management, piece placement logic
- **Features**: Random board setup, piece validation

#### 3. `InteractionSystem.js` - User Input
- **Responsibilities**: Mouse interactions, piece selection, action execution
- **Features**: Raycasting, visual feedback, turn management

#### 4. `LaserSystem.js` - Laser Mechanics
- **Responsibilities**: Laser path calculation, piece destruction
- **Features**: Reflection logic, visual effects, game over detection

#### 5. `PyramidPlacement.js` - Reserve System
- **Responsibilities**: Pyramid placement interface and validation
- **Features**: Cell highlighting, reserve tracking

#### 6. `ScarabSwapSystem.js` - Special Abilities
- **Responsibilities**: Scarab swap mechanics and cooldowns
- **Features**: Swap animations, ability management

### Piece Classes
- **`Sphinx.js`**: Laser emitter model with red lens
- **`Pharaoh.js`**: King piece with crown ornament
- **`Anubis.js`**: Shield piece with front protection
- **`Pyramid.js`**: Mirror piece with diagonal faces
- **`Scarab.js`**: Special piece with X-shaped mirrors

### Styling
- **`style.css`**: Minimal styling for UI overlay
- **Color Scheme**: Egyptian-inspired palette with red accents
- **Responsive Design**: Canvas fills viewport, UI positioned overlays

## How to Play

### Basic Controls
1. **Select a Piece**: Click on any piece belonging to current player
2. **Move**: Click red arrow to move piece in that direction
3. **Rotate**: Click gray curved arrow to rotate piece
4. **Place Pyramid**: Click "Place Pyramid" button, then click highlighted cell
5. **Swap with Scarab**: Click swap buttons when Scarab is selected

### Game Flow
1. **Start**: Game begins with randomly placed pieces
2. **Player 1 Turn**: Make one action (move, rotate, place pyramid, or swap)
3. **Laser Fire**: Sphinx automatically fires laser
4. **Switch**: Player 2's turn begins
5. **Continue**: Alternate until Pharaoh is destroyed

### Visual Indicators
- **Selected Piece**: Red emissive glow
- **Valid Moves**: Red arrows appear around piece
- **Valid Rotation**: Gray rotation arrows appear
- **Valid Pyramid Placement**: Pulsing transparent squares
- **Current Player**: Displayed in red in UI panel

## Browser Compatibility
- **Chrome 60+**: Full support
- **Firefox 55+**: Full support
- **Edge 79+**: Full support
- **Safari 11+**: Full support
- **Mobile Browsers**: Limited For Now (not optimized for touch)

## Performance Notes
- **WebGL Required**: Game uses Three.js for 3D rendering
- **GPU Acceleration**: Recommended for smooth animations
- **Memory**: Clean disposal of 3D objects to prevent leaks
- **Animation**: 60 FPS target with smooth transitions

## Future Enhancements
- Multiplayer network play
- AI opponent
- Game replay system
- Additional game modes
- Mobile touch controls
- Sound effects and music
- Player statistics and achievements

## License
This project is for educational purposes. Khet is a trademark of [trademark holder]. All game logic and 3D models created for this implementation.

## Credits
- **Three.js**: 3D graphics library
- **Original Khet Design**: Innovative Games
- **Game Design**: Based on Khet 2.0 ruleset

---
**Enjoy the game!** Strategy and careful planning are key to victory.