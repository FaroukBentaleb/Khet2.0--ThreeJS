import * as THREE from 'three';

export class Sphinx {
    constructor(color = 0x0000ff) {
        this.mesh = new THREE.Group();
        
        // Base platform (wider, flatter)
        const baseGeometry = new THREE.BoxGeometry(0.75, 0.15, 0.75);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(0.8),
            roughness: 0.6,
            metalness: 0.4
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.075;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // Main body - Egyptian sphinx style (lower, wider)
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.35, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.4,
            metalness: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.325;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Head/headdress - front
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.3);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(1.1),
            roughness: 0.3,
            metalness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.55, -0.3);
        head.castShadow = true;
        this.mesh.add(head);

        // Laser emitter (prominent red lens on front)
        const emitterGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16);
        const emitterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE94B3C,
            emissive: 0xA41E34,
            emissiveIntensity: 0.7,
            roughness: 0.1,
            metalness: 0.9
        });
        const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
        emitter.rotation.x = Math.PI / 2;
        emitter.position.set(0, 0.325, -0.525);
        emitter.castShadow = true;
        this.mesh.add(emitter);
        
        // Laser lens glow
        const glowGeometry = new THREE.CircleGeometry(0.09, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xE94B3C,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, 0.325, -0.59);
        this.mesh.add(glow);

        this.type = 'Sphinx';
    }

    setPosition(x, z) {
        this.mesh.position.x = x;
        this.mesh.position.z = z;
    }

    rotateY(angle) {
        this.mesh.rotation.y = angle;
    }
}