import * as THREE from 'three';

export class Anubis {
    constructor(color = 0xffa500) {
        this.mesh = new THREE.Group();
        
        // Main body - rectangular to show directionality
        const bodyGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.5,
            metalness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.25;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Shield (front face indicator) - slightly lighter color
        const shieldGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.05);
        const shieldMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(1.3),
            roughness: 0.3,
            metalness: 0.7
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(0, 0.25, 0.225);
        shield.castShadow = true;
        this.mesh.add(shield);

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