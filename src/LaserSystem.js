import * as THREE from 'three';

export class LaserSystem {
    constructor(khetGame) {
        this.khetGame = khetGame;
        this.game = khetGame.game;
        this.scene = khetGame.scene;
        
        this.laserBeam = null;
        this.laserPath = [];
        this.destroyedPieces = [];
        
        // Laser material
        this.laserMaterial = new THREE.LineBasicMaterial({
            color: 0xE94B3C,
            linewidth: 3,
            transparent: true,
            opacity: 0.9
        });
        
        // Explosion particle material
        this.explosionMaterial = new THREE.PointsMaterial({
            color: 0xE94B3C,
            size: 0.1,
            transparent: true,
            opacity: 1
        });
    }

    /**
     * Fire the laser from the current player's Sphinx
     */
    fireLaser() {
        const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
        const sphinx = currentPlayer.pieces.sphinx;
        
        if (!sphinx) {
            console.log('No sphinx to fire from!');
            return;
        }

        // Check if Sphinx was swapped this turn (doesn't fire)
        if (currentPlayer.sphinxSwapped) {
            console.log(`Player ${this.game.currentPlayer}'s Sphinx was swapped - no laser this turn`);
            currentPlayer.sphinxSwapped = false;
            return;
        }

        console.log(`Player ${this.game.currentPlayer}'s Sphinx fires from (${sphinx.x}, ${sphinx.y}) facing ${sphinx.direction}`);
        
        // Calculate laser path
        this.laserPath = [];
        this.destroyedPieces = [];
        this.traceLaserPath(sphinx.x, sphinx.y, sphinx.direction);
        
        // Animate and process laser
        this.animateLaser();
    }

    /**
     * Trace the complete path of the laser beam
     */
    traceLaserPath(startX, startY, startDirection) {
        let x = startX;
        let y = startY;
        let direction = startDirection;
        
        // Add starting point (at the Sphinx position)
        this.laserPath.push({ x, y, type: 'start' });
        
        // Maximum iterations to prevent infinite loops
        let iterations = 0;
        const maxIterations = 200;
        
        while (iterations < maxIterations) {
            iterations++;
            
            // Move one step in current direction FROM the sphinx
            const next = this.getNextPosition(x, y, direction);
            x = next.x;
            y = next.y;
            
            // Check if laser left the board
            if (x < 0 || x >= 10 || y < 0 || y >= 10) {
                this.laserPath.push({ x, y, type: 'exit' });
                break;
            }
            
            // Check what's at this position
            const piece = this.game.board[y][x];
            
            if (!piece) {
                // Empty cell - laser continues
                this.laserPath.push({ x, y, type: 'pass' });
                continue;
            }
            
            // If it's the firing Sphinx, skip it (laser starts from it)
            const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
            if (piece === currentPlayer.pieces.sphinx && x === startX && y === startY) {
                this.laserPath.push({ x, y, type: 'pass' });
                continue;
            }
            
            // Laser hit something
            const interaction = this.getLaserInteraction(piece, direction);
            
            if (interaction.type === 'REFLECT') {
                // Laser bounces
                this.laserPath.push({ x, y, type: 'reflect', piece });
                direction = interaction.newDirection;
            } else if (interaction.type === 'BLOCK') {
                // Shield blocks laser
                this.laserPath.push({ x, y, type: 'block', piece });
                break;
            } else if (interaction.type === 'DESTROY') {
                // Laser destroys piece
                this.laserPath.push({ x, y, type: 'destroy', piece });
                this.destroyedPieces.push({ piece, x, y });
                // Laser continues through destroyed piece
            }
        }
        
        if (iterations >= maxIterations) {
            console.warn('Laser path calculation exceeded max iterations!');
        }
    }

    /**
     * Get next position based on current direction
     */
    getNextPosition(x, y, direction) {
        switch (direction) {
            case 'UP': return { x, y: y - 1 };
            case 'DOWN': return { x, y: y + 1 };
            case 'LEFT': return { x: x - 1, y };
            case 'RIGHT': return { x: x + 1, y };
            default: return { x, y };
        }
    }

    /**
     * Determine how laser interacts with a piece
     */
    getLaserInteraction(piece, laserDirection) {
        const type = piece.type;
        const pieceDirection = piece.direction;
        
        // Sphinx - all sides are shields
        if (type === 'SPHINX') {
            return { type: 'BLOCK' };
        }
        
        // Pharaoh - vulnerable on all sides
        if (type === 'PHARAOH') {
            return { type: 'DESTROY' };
        }
        
        // Anubis - shield on front face only
        if (type === 'ANUBIS') {
            if (this.isHittingShield(pieceDirection, laserDirection)) {
                return { type: 'BLOCK' };
            } else {
                return { type: 'DESTROY' };
            }
        }
        
        // Pyramid - diagonal mirror on two faces
        if (type === 'PYRAMID') {
            const reflection = this.getPyramidReflection(pieceDirection, laserDirection);
            if (reflection) {
                return { type: 'REFLECT', newDirection: reflection };
            } else {
                return { type: 'DESTROY' };
            }
        }
        
        // Scarab - diagonal mirrors on all sides (indestructible)
        if (type === 'SCARAB') {
            const reflection = this.getScarabReflection(pieceDirection, laserDirection);
            return { type: 'REFLECT', newDirection: reflection };
        }
        
        return { type: 'PASS' };
    }

    /**
     * Check if laser is hitting Anubis shield
     */
    isHittingShield(pieceDirection, laserDirection) {
        // Shield faces the piece's direction
        // Laser hits shield if coming from that direction
        const oppositeDirection = this.getOppositeDirection(laserDirection);
        return oppositeDirection === pieceDirection;
    }

    /**
     * Calculate pyramid reflection
     * Pyramid has diagonal mirror - reflects on 2 adjacent faces
     */
    getPyramidReflection(pieceDirection, laserDirection) {
        // Pyramid orientation determines which faces have mirrors
        // Mirror is diagonal, so it reflects at 90 degrees
        
        const reflectionMap = {
            'UP': {
                'DOWN': 'LEFT',   // Coming from bottom, reflects left
                'RIGHT': 'UP'     // Coming from right, reflects up
            },
            'RIGHT': {
                'LEFT': 'UP',     // Coming from left, reflects up
                'DOWN': 'RIGHT'   // Coming from bottom, reflects right
            },
            'DOWN': {
                'UP': 'RIGHT',    // Coming from top, reflects right
                'LEFT': 'DOWN'    // Coming from left, reflects down
            },
            'LEFT': {
                'RIGHT': 'DOWN',  // Coming from right, reflects down
                'UP': 'LEFT'      // Coming from top, reflects left
            }
        };
        
        return reflectionMap[pieceDirection]?.[laserDirection] || null;
    }

    /**
     * Calculate scarab reflection
     * Scarab has two diagonal mirrors (X shape) - reflects all directions
     */
    getScarabReflection(pieceDirection, laserDirection) {
        // Scarab reflects at 90 degrees based on orientation
        const reflectionMap = {
            'UP': {
                'LEFT': 'DOWN',
                'RIGHT': 'UP',
                'UP': 'RIGHT',
                'DOWN': 'LEFT'
            },
            'RIGHT': {
                'UP': 'RIGHT',
                'DOWN': 'LEFT',
                'LEFT': 'UP',
                'RIGHT': 'DOWN'
            },
            'DOWN': {
                'RIGHT': 'UP',
                'LEFT': 'DOWN',
                'DOWN': 'RIGHT',
                'UP': 'LEFT'
            },
            'LEFT': {
                'DOWN': 'RIGHT',
                'UP': 'LEFT',
                'RIGHT': 'DOWN',
                'LEFT': 'UP'
            }
        };
        
        return reflectionMap[pieceDirection]?.[laserDirection] || laserDirection;
    }

    /**
     * Get opposite direction
     */
    getOppositeDirection(direction) {
        const opposites = {
            'UP': 'DOWN',
            'DOWN': 'UP',
            'LEFT': 'RIGHT',
            'RIGHT': 'LEFT'
        };
        return opposites[direction];
    }

    /**
     * Animate the laser beam
     */
    async animateLaser() {
        // Draw laser path
        this.drawLaserBeam();
        
        // Wait for laser animation
        await this.sleep(1000);
        
        // Process destroyed pieces
        await this.processDestructions();
        
        // Remove laser beam
        this.clearLaserBeam();
        
        // Check win condition
        this.checkGameOver();
    }

    /**
     * Draw the laser beam as a line
     */
    drawLaserBeam() {
        const points = [];
        
        for (const segment of this.laserPath) {
            const worldPos = this.khetGame.boardToWorld(segment.x, segment.y);
            points.push(new THREE.Vector3(worldPos.x, 0.3, worldPos.z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.laserBeam = new THREE.Line(geometry, this.laserMaterial);
        this.scene.add(this.laserBeam);
        
        // Add glow effect
        const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const glowMaterial = new THREE.LineBasicMaterial({
            color: 0xE94B3C,
            linewidth: 6,
            transparent: true,
            opacity: 0.3
        });
        this.laserGlow = new THREE.Line(glowGeometry, glowMaterial);
        this.scene.add(this.laserGlow);
    }

    /**
     * Clear laser beam from scene
     */
    clearLaserBeam() {
        if (this.laserBeam) {
            this.scene.remove(this.laserBeam);
            this.laserBeam.geometry.dispose();
            this.laserBeam.material.dispose();
            this.laserBeam = null;
        }
        
        if (this.laserGlow) {
            this.scene.remove(this.laserGlow);
            this.laserGlow.geometry.dispose();
            this.laserGlow.material.dispose();
            this.laserGlow = null;
        }
    }

    /**
     * Process all destroyed pieces
     */
    async processDestructions() {
        for (const destroyed of this.destroyedPieces) {
            await this.destroyPiece(destroyed.piece, destroyed.x, destroyed.y);
        }
    }

    /**
     * Destroy a piece with explosion effect
     */
    async destroyPiece(piece, x, y) {
        console.log(`Destroying ${piece.type} at (${x}, ${y})`);
        
        // Create explosion effect
        await this.createExplosion(piece.mesh3D.position);
        
        // Remove from board
        this.game.board[y][x] = null;
        
        // Remove 3D mesh
        if (piece.mesh3D) {
            this.scene.remove(piece.mesh3D);
            this.disposeMesh(piece.mesh3D);
        }
        
        // Handle pyramid destruction - add to opponent's reserve after 1 turn
        if (piece.type === 'PYRAMID') {
            const opponent = this.game.players[piece.owner === 1 ? 'p2' : 'p1'];
            opponent.reserve.cooldown.push({
                type: 'PYRAMID',
                turnsRemaining: 1
            });
        }
        
        // Remove from player's piece list
        const owner = this.game.players[`p${piece.owner}`];
        if (piece.type === 'ANUBIS') {
            owner.pieces.anubis = owner.pieces.anubis.filter(a => a !== piece);
        } else if (piece.type === 'SCARAB') {
            owner.pieces.scarab = null;
        } else if (piece.type === 'PHARAOH') {
            owner.pieces.pharaoh = null;
        } else if (piece.type === 'SPHINX') {
            owner.pieces.sphinx = null;
        } else if (piece.type === 'PYRAMID') {
            owner.pieces.pyramids = owner.pieces.pyramids.filter(p => p !== piece);
        }
    }

    /**
     * Create explosion particle effect
     */
    async createExplosion(position) {
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + (Math.random() - 0.5) * 0.5,
                position.z + (Math.random() - 0.5) * 0.5
            );
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(particles, 3));
        
        const particleSystem = new THREE.Points(geometry, this.explosionMaterial);
        this.scene.add(particleSystem);
        
        // Animate explosion
        const startTime = Date.now();
        const duration = 500;
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                if (progress < 1) {
                    particleSystem.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
                    particleSystem.material.opacity = 1 - progress;
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(particleSystem);
                    geometry.dispose();
                    resolve();
                }
            };
            animate();
        });
    }

    /**
     * Dispose of a 3D mesh and its children
     */
    disposeMesh(mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => mat.dispose());
            } else {
                mesh.material.dispose();
            }
        }
        if (mesh.children) {
            mesh.children.forEach(child => this.disposeMesh(child));
        }
    }

    /**
     * Sleep helper for animations
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if game is over
     */
    checkGameOver() {
        const p1Pharaoh = this.game.players.p1.pieces.pharaoh;
        const p2Pharaoh = this.game.players.p2.pieces.pharaoh;
        
        if (!p1Pharaoh && !p2Pharaoh) {
            this.endGame('DRAW', 'Both Pharaohs destroyed!');
        } else if (!p1Pharaoh) {
            this.endGame('PLAYER_2', 'Player 1\'s Pharaoh destroyed!');
        } else if (!p2Pharaoh) {
            this.endGame('PLAYER_1', 'Player 2\'s Pharaoh destroyed!');
        } else if (this.game.turnCount >= 100) {
            this.endGame('DRAW', '100 turns reached!');
        }
    }

    /**
     * End the game
     */
    endGame(winner, reason) {
        console.log(`Game Over! Winner: ${winner}, Reason: ${reason}`);
        
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(13, 13, 13, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
            color: #DDDCC5;
        `;
        
        const title = document.createElement('h1');
        title.textContent = 'Game Over!';
        title.style.cssText = `
            font-size: 64px;
            color: #E94B3C;
            margin-bottom: 20px;
        `;
        
        const winnerText = document.createElement('h2');
        if (winner === 'DRAW') {
            winnerText.textContent = 'Draw!';
            winnerText.style.color = '#C5C3D8';
        } else {
            winnerText.textContent = `${winner.replace('_', ' ')} Wins!`;
            winnerText.style.color = '#E94B3C';
        }
        winnerText.style.cssText += `
            font-size: 48px;
            margin-bottom: 10px;
        `;
        
        const reasonText = document.createElement('p');
        reasonText.textContent = reason;
        reasonText.style.cssText = `
            font-size: 24px;
            color: #AAAFBA;
            margin-bottom: 40px;
        `;
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'New Game';
        restartButton.style.cssText = `
            padding: 20px 40px;
            font-size: 20px;
            background: #A41E34;
            color: #DDDCC5;
            border: 2px solid #E94B3C;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        `;
        restartButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        overlay.appendChild(title);
        overlay.appendChild(winnerText);
        overlay.appendChild(reasonText);
        overlay.appendChild(restartButton);
        
        document.body.appendChild(overlay);
    }
}