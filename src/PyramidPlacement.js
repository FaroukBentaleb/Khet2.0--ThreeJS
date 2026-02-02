import * as THREE from 'three';
import { Pyramid } from './pieces/Pyramid';

export class PyramidPlacement {
    constructor(khetGame, interactionSystem) {
        this.khetGame = khetGame;
        this.interactionSystem = interactionSystem;
        this.game = khetGame.game;
        this.scene = khetGame.scene;
        
        this.placementMode = false;
        this.ghostPyramid = null;
        this.validCells = [];
        this.cellIndicators = [];
        
        this.createUI();
    }

    createUI() {
        const button = document.createElement('button');
        button.id = 'pyramid-placement-btn';
        button.textContent = 'Place Pyramid';
        button.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            background: #A41E34;
            color: #DDDCC5;
            border: 2px solid #E94B3C;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            font-family: Arial, sans-serif;
            transition: all 0.3s ease;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#E94B3C';
            button.style.transform = 'translateX(-50%) scale(1.05)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#A41E34';
            button.style.transform = 'translateX(-50%) scale(1)';
        });

        button.addEventListener('click', () => this.togglePlacementMode());

        document.body.appendChild(button);
        this.button = button;
        
        this.updateButtonState();
    }

    updateButtonState() {
        const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
        const pyramidsAvailable = currentPlayer.reserve.pyramids;
        
        if (pyramidsAvailable <= 0) {
            this.button.disabled = true;
            this.button.style.opacity = '0.5';
            this.button.style.cursor = 'not-allowed';
            this.button.textContent = 'No Pyramids';
        } else {
            this.button.disabled = false;
            this.button.style.opacity = '1';
            this.button.style.cursor = 'pointer';
            this.button.textContent = `Place Pyramid (${pyramidsAvailable})`;
        }
    }

    togglePlacementMode() {
        if (this.placementMode) {
            this.exitPlacementMode();
        } else {
            this.enterPlacementMode();
        }
    }

    enterPlacementMode() {
        const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
        
        if (currentPlayer.reserve.pyramids <= 0) {
            console.log('No pyramids available!');
            return;
        }

        this.placementMode = true;
        this.button.textContent = 'Cancel Placement';
        this.button.style.background = '#4D5766';
        
        // Deselect any selected piece
        if (this.interactionSystem.selectedPiece) {
            this.interactionSystem.deselectPiece();
        }

        // Show valid placement cells
        this.showValidCells();
        
        console.log('Pyramid placement mode activated');
    }

    exitPlacementMode() {
        this.placementMode = false;
        this.clearValidCells();
        this.updateButtonState();
        
        console.log('Pyramid placement mode deactivated');
    }

    showValidCells() {
        this.clearValidCells();

        // Get forbidden cells (adjacent to Pharaohs and Sphinxes)
        const forbidden = new Set();
        const players = [this.game.players.p1, this.game.players.p2];
        
        players.forEach(player => {
            // Add cells around Pharaoh
            if (player.pieces.pharaoh) {
                this.addAdjacentCells(forbidden, player.pieces.pharaoh.x, player.pieces.pharaoh.y);
            }
            // Add cells around Sphinx
            if (player.pieces.sphinx) {
                this.addAdjacentCells(forbidden, player.pieces.sphinx.x, player.pieces.sphinx.y);
            }
        });

        // Create indicators for all valid empty cells
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const key = `${x},${y}`;
                if (this.game.board[y][x] === null && !forbidden.has(key)) {
                    this.createCellIndicator(x, y);
                    this.validCells.push({ x, y });
                }
            }
        }
    }

    addAdjacentCells(set, x, y) {
        // Add the cell itself
        set.add(`${x},${y}`);
        
        // Add orthogonally adjacent cells
        const adjacent = [
            [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]
        ];
        
        adjacent.forEach(([ax, ay]) => {
            if (ax >= 0 && ax < 10 && ay >= 0 && ay < 10) {
                set.add(`${ax},${ay}`);
            }
        });
    }

    createCellIndicator(x, y) {
        const worldPos = this.khetGame.boardToWorld(x, y);
        
        // Create a glowing square indicator
        const geometry = new THREE.PlaneGeometry(0.8, 0.8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xC5C3D8,
            emissive: 0xE94B3C,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const indicator = new THREE.Mesh(geometry, material);
        indicator.rotation.x = -Math.PI / 2;
        indicator.position.set(worldPos.x, 0.02, worldPos.z);
        indicator.userData.cellX = x;
        indicator.userData.cellY = y;
        indicator.userData.isPyramidPlacement = true;
        
        this.scene.add(indicator);
        this.cellIndicators.push(indicator);
    }

    clearValidCells() {
        this.cellIndicators.forEach(indicator => {
            this.scene.remove(indicator);
            if (indicator.geometry) indicator.geometry.dispose();
            if (indicator.material) indicator.material.dispose();
        });
        this.cellIndicators = [];
        this.validCells = [];
    }

    handleClick(intersects) {
        if (!this.placementMode) return false;

        // Check if clicked on a valid cell indicator
        for (const intersect of intersects) {
            if (intersect.object.userData.isPyramidPlacement) {
                const x = intersect.object.userData.cellX;
                const y = intersect.object.userData.cellY;
                this.placePyramid(x, y);
                return true;
            }
        }

        return false;
    }

    placePyramid(x, y) {
        const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
        
        if (currentPlayer.reserve.pyramids <= 0) {
            console.log('No pyramids available!');
            return;
        }

        // Create pyramid piece
        const pyramid = {
            type: 'PYRAMID',
            x,
            y,
            direction: 'UP', // Default direction, player can rotate it
            owner: this.game.currentPlayer
        };

        // Add to board
        this.game.board[y][x] = pyramid;

        // Create 3D mesh
        const color = this.khetGame.getPlayerColor(this.game.currentPlayer, 'PYRAMID');
        const pyramidMesh = new Pyramid(color);
        const pos = this.khetGame.boardToWorld(x, y);
        pyramidMesh.setPosition(pos.x, pos.z);
        pyramidMesh.rotateY(this.khetGame.directionToRotation(pyramid.direction));
        this.scene.add(pyramidMesh.mesh);
        pyramid.mesh3D = pyramidMesh.mesh;

        // Add to player's pyramids list
        currentPlayer.pieces.pyramids.push(pyramid);

        // Decrease reserve
        currentPlayer.reserve.pyramids--;

        console.log(`Placed pyramid at (${x}, ${y})`);

        // Exit placement mode
        this.exitPlacementMode();
        
        // End turn
        this.interactionSystem.endTurn();
        
        // Update UI
        if (this.khetGame.controller) {
            this.khetGame.controller.updateUI();
        }
    }

    update() {
        // Pulse animation for cell indicators
        if (this.placementMode && this.cellIndicators.length > 0) {
            const time = Date.now() * 0.002;
            const pulse = Math.sin(time) * 0.2 + 0.6;
            
            this.cellIndicators.forEach(indicator => {
                indicator.material.opacity = pulse;
            });
        }
    }
}