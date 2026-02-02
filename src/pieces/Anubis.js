import * as THREE from 'three';

export class Anubis {
    constructor(color = 0xffa500) {
        this.mesh = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(0.7, 0.12, 0.45);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(0.75),
            roughness: 0.6,
            metalness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.06;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // Main body - rectangular to show directionality
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.5,
            metalness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.32;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        
        // Jackal head on top
        const headGeometry = new THREE.BoxGeometry(0.35, 0.3, 0.3);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(1.1),
            roughness: 0.4,
            metalness: 0.5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.67, 0);
        head.castShadow = true;
        this.mesh.add(head);

        // Shield plate (front face) - prominent and lighter
        const shieldGeometry = new THREE.BoxGeometry(0.52, 0.5, 0.06);
        const shieldMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDDDCC5, // Light cream - stands out
            roughness: 0.2,
            metalness: 0.85,
            emissive: new THREE.Color(color).multiplyScalar(0.1),
            emissiveIntensity: 0.2
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(0, 0.32, 0.265);
        shield.castShadow = true;
        this.mesh.add(shield);
        
        // Shield border for emphasis
        const borderGeometry = new THREE.BoxGeometry(0.56, 0.54, 0.04);
        const borderMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(1.3),
            roughness: 0.3,
            metalness: 0.7
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.set(0, 0.32, 0.24);
        this.mesh.add(border);

        this.type = 'Anubis';
    }

    setPosition(x, z) {
        this.mesh.position.x = x;
        this.mesh.position.z = z;
    }

    rotateY(angle) {
        this.mesh.rotation.y = angle;
    }
}