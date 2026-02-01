import * as THREE from 'three';

export class InteractionSystem {
    constructor(khetGame) {
        this.khetGame = khetGame;
        this.game = khetGame.game;
        this.scene = khetGame.scene;
        this.camera = khetGame.camera;
        this.renderer = khetGame.renderer;
        
        this.selectedPiece = null;
        this.selectedMesh = null;
        this.arrowHelpers = [];
        this.rotationIndicators = [];
        
        // Raycaster for mouse picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Arrow materials
        this.moveArrowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE94B3C, 
            emissive: 0xA41E34,
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.7
        });
        
        this.rotateArrowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xC5C3D8,
            emissive: 0xAAAFBA,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.7
        });
        
        this.hoverMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDDDCC5,
            emissive: 0xE94B3C,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('InteractionSystem initialized');
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
    }

    onMouseClick(event) {
        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all possible intersectable objects
        const allObjects = this.scene.children.filter(child => child.visible);
        const allIntersects = this.raycaster.intersectObjects(allObjects, true);

        // First check pyramid placement
        if (this.khetGame.pyramidPlacement && this.khetGame.pyramidPlacement.handleClick(allIntersects)) {
            return;
        }

        // Then check if clicking on an arrow
        const arrowObjects = [...this.arrowHelpers, ...this.rotationIndicators];
        const arrowIntersects = this.raycaster.intersectObjects(arrowObjects, true);
        
        if (arrowIntersects.length > 0) {
            const clickedArrow = arrowIntersects[0].object;
            let arrowParent = clickedArrow;
            
            // Find the root arrow group
            while (arrowParent.parent && !arrowParent.userData.action) {
                arrowParent = arrowParent.parent;
            }
            
            if (arrowParent.userData.action) {
                this.executeAction(arrowParent.userData.action);
                return;
            }
        }

        // Then check if clicking on a piece
        const allMeshes = this.getAllPieceMeshes();
        const pieceIntersects = this.raycaster.intersectObjects(allMeshes, true);

        if (pieceIntersects.length > 0) {
            let clickedMesh = pieceIntersects[0].object;
            while (clickedMesh.parent && clickedMesh.parent.type === 'Group' && clickedMesh.parent !== this.scene) {
                clickedMesh = clickedMesh.parent;
            }

            const piece = this.findPieceByMesh(clickedMesh);
            if (piece && piece.owner === this.game.currentPlayer) {
                this.selectPiece(piece, clickedMesh);
                return;
            }
        }

        // If clicking on empty space, deselect
        this.deselectPiece();
    }

    onMouseMove(event) {
        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check if hovering over an arrow
        const arrowObjects = [...this.arrowHelpers, ...this.rotationIndicators];
        const intersects = this.raycaster.intersectObjects(arrowObjects, true);
        
        // Reset all arrows to normal material
        arrowObjects.forEach(arrow => {
            if (arrow.children) {
                arrow.children.forEach(child => {
                    if (child.material && arrow.userData.originalMaterial) {
                        child.material = arrow.userData.originalMaterial;
                    }
                });
            }
        });

        // Highlight hovered arrow
        if (intersects.length > 0) {
            let hoveredArrow = intersects[0].object;
            while (hoveredArrow.parent && !hoveredArrow.userData.action) {
                hoveredArrow = hoveredArrow.parent;
            }
            
            if (hoveredArrow.userData.action && hoveredArrow.children) {
                document.body.style.cursor = 'pointer';
                hoveredArrow.children.forEach(child => {
                    if (child.material) {
                        child.material = this.hoverMaterial;
                    }
                });
            }
        } else {
            document.body.style.cursor = 'default';
        }
    }

    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    selectPiece(piece, mesh) {
        // Deselect previous
        if (this.selectedMesh) {
            this.deselectPiece();
        }

        this.selectedPiece = piece;
        this.selectedMesh = mesh;

        // Visual feedback - highlight piece
        mesh.children.forEach(child => {
            if (child.material) {
                child.material.emissive = new THREE.Color(0xE94B3C);
                child.material.emissiveIntensity = 0.4;
            }
        });

        // Show action arrows
        this.showActionArrows(piece);

        console.log('Selected:', piece.type, 'at', piece.x, piece.y);
    }

    deselectPiece() {
        if (this.selectedMesh) {
            // Remove highlight
            this.selectedMesh.children.forEach(child => {
                if (child.material) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        }

        // Remove all arrows
        this.clearArrows();

        this.selectedPiece = null;
        this.selectedMesh = null;
    }

    showActionArrows(piece) {
        this.clearArrows();

        const worldPos = this.khetGame.boardToWorld(piece.x, piece.y);

        // Show rotation arrows (always available)
        this.createRotationArrows(worldPos, piece);

        // Show movement arrows (if piece can move)
        if (this.canPieceMove(piece)) {
            this.createMovementArrows(worldPos, piece);
        }
    }

    canPieceMove(piece) {
        return piece.type !== 'SPHINX' && piece.type !== 'PHARAOH';
    }

    createMovementArrows(worldPos, piece) {
        const directions = [
            { dx: 0, dy: -1, name: 'UP', rotation: 0 },
            { dx: 1, dy: 0, name: 'RIGHT', rotation: Math.PI / 2 },
            { dx: 0, dy: 1, name: 'DOWN', rotation: Math.PI },
            { dx: -1, dy: 0, name: 'LEFT', rotation: -Math.PI / 2 }
        ];

        directions.forEach(dir => {
            const toX = piece.x + dir.dx;
            const toY = piece.y + dir.dy;

            // Check if move is valid
            if (this.isValidMove(piece, toX, toY)) {
                const arrow = this.createMoveArrow(dir.rotation);
                arrow.position.set(
                    worldPos.x + dir.dx * 0.6,
                    0.5,
                    worldPos.z + dir.dy * 0.6
                );
                arrow.userData.action = {
                    type: 'MOVE',
                    toX: toX,
                    toY: toY
                };
                arrow.userData.originalMaterial = this.moveArrowMaterial;
                
                this.scene.add(arrow);
                this.arrowHelpers.push(arrow);
            }
        });
    }

    createRotationArrows(worldPos, piece) {
        // Clockwise rotation arrow (right)
        const cwArrow = this.createRotateArrow(true);
        cwArrow.position.set(worldPos.x + 0.5, 0.7, worldPos.z - 0.5);
        cwArrow.userData.action = {
            type: 'ROTATE',
            clockwise: true
        };
        cwArrow.userData.originalMaterial = this.rotateArrowMaterial;
        
        this.scene.add(cwArrow);
        this.rotationIndicators.push(cwArrow);

        // Counter-clockwise rotation arrow (left)
        const ccwArrow = this.createRotateArrow(false);
        ccwArrow.position.set(worldPos.x - 0.5, 0.7, worldPos.z - 0.5);
        ccwArrow.userData.action = {
            type: 'ROTATE',
            clockwise: false
        };
        ccwArrow.userData.originalMaterial = this.rotateArrowMaterial;
        
        this.scene.add(ccwArrow);
        this.rotationIndicators.push(ccwArrow);
    }

    createMoveArrow(rotation) {
        const group = new THREE.Group();

        // Arrow shaft
        const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const shaft = new THREE.Mesh(shaftGeometry, this.moveArrowMaterial);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = -0.1;
        group.add(shaft);

        // Arrow head (cone)
        const headGeometry = new THREE.ConeGeometry(0.12, 0.2, 8);
        const head = new THREE.Mesh(headGeometry, this.moveArrowMaterial);
        head.rotation.x = Math.PI / 2;
        head.rotation.y = Math.PI;
        head.position.z = -0.25;
        group.add(head);

        group.rotation.y = rotation;
        
        return group;
    }

    createRotateArrow(clockwise) {
        const group = new THREE.Group();

        // Create curved arrow using torus
        const curve = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI * 1.5);
        const curvedArrow = new THREE.Mesh(curve, this.rotateArrowMaterial);
        curvedArrow.rotation.x = -Math.PI / 2;
        group.add(curvedArrow);

        // Arrow head
        const headGeometry = new THREE.ConeGeometry(0.08, 0.15, 6);
        const head = new THREE.Mesh(headGeometry, this.rotateArrowMaterial);
        head.rotation.z = clockwise ? -Math.PI / 2 : Math.PI / 2;
        head.position.set(
            clockwise ? 0.15 : -0.15,
            0,
            clockwise ? -0.15 : 0.15
        );
        group.add(head);

        if (!clockwise) {
            group.rotation.y = Math.PI;
        }

        // Make it slightly smaller
        group.scale.set(0.8, 0.8, 0.8);

        return group;
    }

    clearArrows() {
        // Remove movement arrows
        this.arrowHelpers.forEach(arrow => {
            this.scene.remove(arrow);
            this.disposeObject(arrow);
        });
        this.arrowHelpers = [];

        // Remove rotation arrows
        this.rotationIndicators.forEach(arrow => {
            this.scene.remove(arrow);
            this.disposeObject(arrow);
        });
        this.rotationIndicators = [];
    }

    disposeObject(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
            } else {
                obj.material.dispose();
            }
        }
        if (obj.children) {
            obj.children.forEach(child => this.disposeObject(child));
        }
    }

    executeAction(action) {
        if (!this.selectedPiece) return;

        if (action.type === 'MOVE') {
            this.executeMove(action.toX, action.toY);
        } else if (action.type === 'ROTATE') {
            this.executeRotation(action.clockwise);
        }
    }

    executeMove(toX, toY) {
        const piece = this.selectedPiece;
        const fromX = piece.x;
        const fromY = piece.y;

        // Update board
        this.game.board[fromY][fromX] = null;
        this.game.board[toY][toX] = piece;
        piece.x = toX;
        piece.y = toY;

        // Update 3D position with animation
        const pos = this.khetGame.boardToWorld(toX, toY);
        const startPos = { 
            x: piece.mesh3D.position.x, 
            z: piece.mesh3D.position.z 
        };
        const endPos = { x: pos.x, z: pos.z };
        
        this.animateMove(piece.mesh3D, startPos, endPos, 300);

        console.log(`Moved ${piece.type} from (${fromX},${fromY}) to (${toX},${toY})`);
        
        this.deselectPiece();
        this.endTurn();
    }

    executeRotation(clockwise) {
        const piece = this.selectedPiece;
        
        // Rotate direction
        const rotations = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
        const currentIndex = rotations.indexOf(piece.direction);
        const newIndex = clockwise 
            ? (currentIndex + 1) % 4 
            : (currentIndex - 1 + 4) % 4;
        piece.direction = rotations[newIndex];

        // Update 3D rotation with animation
        const newRotation = this.khetGame.directionToRotation(piece.direction);
        this.animateRotation(piece.mesh3D, newRotation, 300);

        console.log(`Rotated ${piece.type} ${clockwise ? 'clockwise' : 'counter-clockwise'} to ${piece.direction}`);
        
        this.deselectPiece();
        this.endTurn();
    }

    animateMove(mesh, start, end, duration) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            mesh.position.x = start.x + (end.x - start.x) * eased;
            mesh.position.z = start.z + (end.z - start.z) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    animateRotation(mesh, targetRotation, duration) {
        const startRotation = mesh.rotation.y;
        const startTime = Date.now();
        
        // Handle rotation wrapping
        let delta = targetRotation - startRotation;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            mesh.rotation.y = startRotation + delta * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                mesh.rotation.y = targetRotation;
            }
        };
        
        animate();
    }

    isValidMove(piece, toX, toY) {
        // Check if destination is on board
        if (toX < 0 || toX >= 10 || toY < 0 || toY >= 10) {
            return false;
        }

        // Check if destination is occupied
        if (this.game.board[toY][toX] !== null) {
            return false;
        }

        // Must be orthogonally adjacent
        const dx = Math.abs(toX - piece.x);
        const dy = Math.abs(toY - piece.y);
        
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    endTurn() {
        // Fire laser (placeholder)
        console.log(`Player ${this.game.currentPlayer}'s Sphinx fires!`);

        // Switch player
        this.game.currentPlayer = this.game.currentPlayer === 1 ? 2 : 1;
        this.game.turnCount++;

        console.log(`Turn ${this.game.turnCount}: Player ${this.game.currentPlayer}'s turn`);
        
        // Update UI if controller exists
        if (this.khetGame.controller) {
            this.khetGame.controller.updateUI();
        }
    }

    getAllPieceMeshes() {
        const meshes = [];
        const players = [this.game.players.p1, this.game.players.p2];
        
        for (const player of players) {
            if (player.pieces.sphinx?.mesh3D) meshes.push(player.pieces.sphinx.mesh3D);
            if (player.pieces.pharaoh?.mesh3D) meshes.push(player.pieces.pharaoh.mesh3D);
            if (player.pieces.scarab?.mesh3D) meshes.push(player.pieces.scarab.mesh3D);
            for (const anubis of player.pieces.anubis) {
                if (anubis.mesh3D) meshes.push(anubis.mesh3D);
            }
        }
        
        return meshes;
    }

    findPieceByMesh(mesh) {
        const players = [this.game.players.p1, this.game.players.p2];
        
        for (const player of players) {
            if (player.pieces.sphinx?.mesh3D === mesh) return player.pieces.sphinx;
            if (player.pieces.pharaoh?.mesh3D === mesh) return player.pieces.pharaoh;
            if (player.pieces.scarab?.mesh3D === mesh) return player.pieces.scarab;
            for (const anubis of player.pieces.anubis) {
                if (anubis.mesh3D === mesh) return anubis;
            }
        }
        
        return null;
    }
}
