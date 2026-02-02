export class ScarabSwapSystem {
    constructor(khetGame, interactionSystem) {
        this.khetGame = khetGame;
        this.interactionSystem = interactionSystem;
        this.game = khetGame.game;
        this.scene = khetGame.scene;
        
        this.createUI();
    }

    createUI() {
        const container = document.createElement('div');
        container.id = 'swap-controls';
        container.style.cssText = `
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 1000;
        `;

        // Swap with Sphinx button
        const sphinxButton = document.createElement('button');
        sphinxButton.id = 'swap-sphinx-btn';
        sphinxButton.textContent = 'Swap with Sphinx';
        sphinxButton.style.cssText = this.getButtonStyle();
        sphinxButton.addEventListener('click', () => this.attemptSwap('SPHINX'));
        container.appendChild(sphinxButton);

        // Swap with Pharaoh button
        const pharaohButton = document.createElement('button');
        pharaohButton.id = 'swap-pharaoh-btn';
        pharaohButton.textContent = 'Swap with Pharaoh';
        pharaohButton.style.cssText = this.getButtonStyle();
        pharaohButton.addEventListener('click', () => this.attemptSwap('PHARAOH'));
        container.appendChild(pharaohButton);

        document.body.appendChild(container);
        
        this.sphinxButton = sphinxButton;
        this.pharaohButton = pharaohButton;
        
        this.updateButtonStates();
    }

    getButtonStyle() {
        return `
            padding: 12px 25px;
            background: #4D5766;
            color: #DDDCC5;
            border: 2px solid #AAAFBA;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            font-family: Arial, sans-serif;
            transition: all 0.3s ease;
        `;
    }

    updateButtonStates() {
        const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
        
        if (!currentPlayer.pieces.scarab) {
            // No scarab - disable both buttons
            this.disableButton(this.sphinxButton, 'No Scarab');
            this.disableButton(this.pharaohButton, 'No Scarab');
            return;
        }

        // Initialize cooldowns if they don't exist
        if (!currentPlayer.swapCooldowns) {
            currentPlayer.swapCooldowns = {
                sphinx: 0,
                pharaoh: 0
            };
        }

        // Update Sphinx swap button
        if (currentPlayer.swapCooldowns.sphinx > 0) {
            this.disableButton(this.sphinxButton, `Cooldown: ${currentPlayer.swapCooldowns.sphinx}`);
        } else {
            this.enableButton(this.sphinxButton, 'Swap with Sphinx');
        }

        // Update Pharaoh swap button
        if (currentPlayer.swapCooldowns.pharaoh > 0) {
            this.disableButton(this.pharaohButton, `Cooldown: ${currentPlayer.swapCooldowns.pharaoh}`);
        } else {
            this.enableButton(this.pharaohButton, 'Swap with Pharaoh');
        }
    }

    enableButton(button, text) {
        button.disabled = false;
        button.textContent = text;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.style.background = '#4D5766';
    }

    disableButton(button, text) {
        button.disabled = true;
        button.textContent = text;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.style.background = '#3D4451';
    }

    attemptSwap(targetType) {
        const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
        const scarab = currentPlayer.pieces.scarab;
        
        if (!scarab) {
            console.log('No scarab to swap!');
            return;
        }

        // Initialize cooldowns if needed
        if (!currentPlayer.swapCooldowns) {
            currentPlayer.swapCooldowns = { sphinx: 0, pharaoh: 0 };
        }

        // Check cooldown
        const cooldownKey = targetType.toLowerCase();
        if (currentPlayer.swapCooldowns[cooldownKey] > 0) {
            console.log(`Swap with ${targetType} is on cooldown: ${currentPlayer.swapCooldowns[cooldownKey]} turns remaining`);
            return;
        }

        // Get target piece
        const target = targetType === 'SPHINX' ? currentPlayer.pieces.sphinx : currentPlayer.pieces.pharaoh;
        
        if (!target) {
            console.log(`No ${targetType} to swap with!`);
            return;
        }

        // Perform swap
        this.swapPieces(scarab, target, targetType);
        
        // Set cooldown (4 turns)
        currentPlayer.swapCooldowns[cooldownKey] = 4;
        
        // Mark if Sphinx swapped (won't fire laser this turn)
        if (targetType === 'SPHINX') {
            currentPlayer.sphinxSwapped = true;
        }

        // End turn
        this.interactionSystem.endTurn();
    }

    swapPieces(scarab, target, targetType) {
        console.log(`Swapping Scarab at (${scarab.x},${scarab.y}) with ${targetType} at (${target.x},${target.y})`);
        
        // Store positions
        const scarabX = scarab.x;
        const scarabY = scarab.y;
        const targetX = target.x;
        const targetY = target.y;
        
        // Swap on board
        this.game.board[scarabY][scarabX] = target;
        this.game.board[targetY][targetX] = scarab;
        
        // Swap positions in piece data
        scarab.x = targetX;
        scarab.y = targetY;
        target.x = scarabX;
        target.y = scarabY;
        
        // Animate swap
        this.animateSwap(scarab.mesh3D, target.mesh3D, scarabX, scarabY, targetX, targetY);
    }

    animateSwap(scarabMesh, targetMesh, scarabX, scarabY, targetX, targetY) {
        const scarabStart = this.khetGame.boardToWorld(scarabX, scarabY);
        const scarabEnd = this.khetGame.boardToWorld(targetX, targetY);
        const targetStart = this.khetGame.boardToWorld(targetX, targetY);
        const targetEnd = this.khetGame.boardToWorld(scarabX, scarabY);
        
        const duration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out cubic
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Move scarab
            scarabMesh.position.x = scarabStart.x + (scarabEnd.x - scarabStart.x) * eased;
            scarabMesh.position.z = scarabStart.z + (scarabEnd.z - scarabStart.z) * eased;
            scarabMesh.position.y = Math.sin(progress * Math.PI) * 1.5; // Arc
            
            // Move target
            targetMesh.position.x = targetStart.x + (targetEnd.x - targetStart.x) * eased;
            targetMesh.position.z = targetStart.z + (targetEnd.z - targetStart.z) * eased;
            targetMesh.position.y = Math.sin(progress * Math.PI) * 1.5; // Arc
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Reset Y position
                scarabMesh.position.y = 0;
                targetMesh.position.y = 0;
            }
        };
        
        animate();
    }

    processCooldowns() {
        const currentPlayer = this.game.players[`p${this.game.currentPlayer}`];
        
        if (currentPlayer.swapCooldowns) {
            if (currentPlayer.swapCooldowns.sphinx > 0) {
                currentPlayer.swapCooldowns.sphinx--;
            }
            if (currentPlayer.swapCooldowns.pharaoh > 0) {
                currentPlayer.swapCooldowns.pharaoh--;
            }
        }
        
        // Reset sphinx swapped flag
        currentPlayer.sphinxSwapped = false;
        
        this.updateButtonStates();
    }
}
