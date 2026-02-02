import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pharaoh } from './pieces/Pharaoh';
import { Sphinx } from './pieces/Sphinx';
import { Scarab } from './pieces/Scarab';
import { Anubis } from './pieces/Anubis';
import { Pyramid } from './pieces/Pyramid';
import { initializeGame } from './GameEngine';
import { InteractionSystem } from './InteractionSystem';
import { PyramidPlacement } from './PyramidPlacement';
import { ScarabSwapSystem } from './ScarabSwapSystem';

export class KhetGame {
    constructor() {
        //-----------------Scene & Camera
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2C2C34); // Dark gray from palette

        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        // Better camera position for top-down strategic view
        this.camera.position.set(0, 14, 6);
        this.camera.lookAt(0, 0, 0);

        //-----------------Board Plane
        const planeGeometry = new THREE.PlaneGeometry(10, 10);
        const planeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0D0D0D, // Black from palette
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);

        //-----------------Grid
        const boardSize = 10;
        const divisions = 10;
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x4D5766, linewidth: 1 }); // Blue-gray from palette
        const gridGeometry = new THREE.BufferGeometry();
        const points = [];
        
        for (let i = 0; i <= divisions; i++) {
            const offset = -boardSize / 2 + i;
            // Vertical lines
            points.push(offset, 0.01, -boardSize / 2);
            points.push(offset, 0.01, boardSize / 2);
            // Horizontal lines
            points.push(-boardSize / 2, 0.01, offset);
            points.push(boardSize / 2, 0.01, offset);
        }
        
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
        this.scene.add(gridLines);

        //-----------------Lights
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 12, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Secondary fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 8, -5);
        this.scene.add(fillLight);

        //-----------------Game Logic
        this.game = initializeGame(); // Initialize logical game state
        console.log('Game initialized:', this.game);

        //-----------------Pieces
        this.addPiecesFromGame(); // Add 3D pieces based on game logic

        //-----------------Renderer & Controls
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // OrbitControls for camera movement
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below the board

        //-----------------Handle Window Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        //-----------------Interaction System & Pyramid Placement
        this.interactionSystem = new InteractionSystem(this);
        this.pyramidPlacement = new PyramidPlacement(this, this.interactionSystem);
        this.scarabSwapSystem = new ScarabSwapSystem(this, this.interactionSystem);
        
        // Create simple UI
        this.createUI();

        //-----------------Animation Loop
        this.animate();
    }

    createUI() {
        const ui = document.createElement('div');
        ui.id = 'game-ui';
        ui.innerHTML = `
            <h2>Khet 2.0</h2>
            <div id="turn-info">
                <p><strong>Turn:</strong> <span id="turn-count">0</span></p>
                <p><strong>Current Player:</strong> <span id="current-player" style="color: #E94B3C; font-weight: bold;">Player 1</span></p>
            </div>
            <div id="reserve-info" style="margin-top: 15px; border-top: 1px solid #4D5766; padding-top: 10px;">
                <p><strong>P1 Pyramids:</strong> <span id="p1-pyramids">7</span></p>
                <p><strong>P2 Pyramids:</strong> <span id="p2-pyramids">7</span></p>
            </div>
            <div style="margin-top: 15px; border-top: 1px solid #4D5766; padding-top: 10px; font-size: 12px; color: #C5C3D8;">
                <p style="margin: 3px 0;">• Click piece to select</p>
                <p style="margin: 3px 0;">• Click arrows to move/rotate</p>
                <p style="margin: 3px 0;">• Use button for pyramids</p>
            </div>
        `;
        document.body.appendChild(ui);
    }

    updateUI() {
        document.getElementById('turn-count').textContent = this.game.turnCount;
        document.getElementById('current-player').textContent = `Player ${this.game.currentPlayer}`;
        document.getElementById('p1-pyramids').textContent = this.game.players.p1.reserve.pyramids;
        document.getElementById('p2-pyramids').textContent = this.game.players.p2.reserve.pyramids;
        
        // Update pyramid placement button
        if (this.pyramidPlacement) {
            this.pyramidPlacement.updateButtonState();
        }
    }

    // Add getter for controller compatibility
    get controller() {
        return { updateUI: () => this.updateUI() };
    }

    /**
     * Convert board coordinates (0-9) to 3D world coordinates
     * Board coordinates: (0,0) is top-left, (9,9) is bottom-right
     * World coordinates: centered at origin
     */
    boardToWorld(boardX, boardY) {
        return {
            x: boardX - 4.5,
            z: boardY - 4.5
        };
    }

    /**
     * Get color based on player ID and piece type
     */
    getPlayerColor(playerId, pieceType) {
        // Player 1 - Red/Light team (using reds and light colors from palette)
        const player1Colors = {
            SPHINX: 0xE94B3C,    // Bright red
            PHARAOH: 0xA41E34,   // Deep red
            ANUBIS: 0xDDDCC5,    // Light cream
            SCARAB: 0xC5C3D8,    // Lavender
            PYRAMID: 0xE94B3C    // Bright red
        };

        // Player 2 - Dark/Blue team (using dark grays and blues from palette)
        const player2Colors = {
            SPHINX: 0x3D4451,    // Dark blue-gray
            PHARAOH: 0x2C2C34,   // Dark gray
            ANUBIS: 0x4D5766,    // Blue-gray
            SCARAB: 0xAAAFBA,    // Light blue-gray
            PYRAMID: 0x4D5766    // Blue-gray
        };

        return playerId === 1 ? player1Colors[pieceType] : player2Colors[pieceType];
    }

    /**
     * Convert direction string to Y-axis rotation angle
     */
    directionToRotation(direction) {
        const rotations = {
            UP: 0,
            RIGHT: -Math.PI / 2,
            DOWN: Math.PI,
            LEFT: Math.PI / 2
        };
        return rotations[direction] || 0;
    }

    /**
     * Add all pieces from the game logic to the 3D scene
     */
    addPiecesFromGame() {
        for (const playerId of ['p1', 'p2']) {
            const player = this.game.players[playerId];
            const playerNum = player.id;

            // Add Sphinx
            if (player.pieces.sphinx) {
                const piece = player.pieces.sphinx;
                const color = this.getPlayerColor(playerNum, 'SPHINX');
                const sphinx = new Sphinx(color);
                const pos = this.boardToWorld(piece.x, piece.y);
                
                sphinx.setPosition(pos.x, pos.z);
                sphinx.rotateY(this.directionToRotation(piece.direction));
                this.scene.add(sphinx.mesh);
                piece.mesh3D = sphinx.mesh;
            }

            // Add Pharaoh
            if (player.pieces.pharaoh) {
                const piece = player.pieces.pharaoh;
                const color = this.getPlayerColor(playerNum, 'PHARAOH');
                const pharaoh = new Pharaoh(color);
                const pos = this.boardToWorld(piece.x, piece.y);
                
                pharaoh.setPosition(pos.x, pos.z);
                pharaoh.rotateY(this.directionToRotation(piece.direction));
                this.scene.add(pharaoh.mesh);
                piece.mesh3D = pharaoh.mesh;
            }

            // Add Scarab
            if (player.pieces.scarab) {
                const piece = player.pieces.scarab;
                const color = this.getPlayerColor(playerNum, 'SCARAB');
                const scarab = new Scarab(color);
                const pos = this.boardToWorld(piece.x, piece.y);
                
                scarab.setPosition(pos.x, pos.z);
                scarab.rotateY(this.directionToRotation(piece.direction));
                this.scene.add(scarab.mesh);
                piece.mesh3D = scarab.mesh;
            }

            // Add Anubis pieces
            for (const anubisLogic of player.pieces.anubis) {
                const color = this.getPlayerColor(playerNum, 'ANUBIS');
                const anubis = new Anubis(color);
                const pos = this.boardToWorld(anubisLogic.x, anubisLogic.y);
                
                anubis.setPosition(pos.x, pos.z);
                anubis.rotateY(this.directionToRotation(anubisLogic.direction));
                this.scene.add(anubis.mesh);
                anubisLogic.mesh3D = anubis.mesh;
            }
        }
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        
        // Update pyramid placement animations
        if (this.pyramidPlacement) {
            this.pyramidPlacement.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}