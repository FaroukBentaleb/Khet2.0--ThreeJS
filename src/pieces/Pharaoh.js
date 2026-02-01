import * as THREE from 'three';

export class Pharaoh {
    constructor(color = 0xff0000) {
        this.mesh = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.3,
            metalness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.25;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Crown (top decoration to distinguish Pharaoh)
        const crownGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.2, 8);
        const crownMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffd700, // Gold
            roughness: 0.2,
            metalness: 0.9
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 0.6;
        crown.castShadow = true;
        this.mesh.add(crown);

        this.type = 'Pharaoh';
    }

    setPosition(x, z) {
        this.mesh.position.x = x;
        this.mesh.position.z = z;
    }

    rotateY(angle) {
        this.mesh.rotation.y = angle;
    }
}