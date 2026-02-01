import * as THREE from 'three';

export class Scarab {
    constructor(color = 0x00ff00) {
        this.mesh = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.4,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.2;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Diagonal mirror indicators (two perpendicular planes showing reflection)
        const mirrorGeometry = new THREE.PlaneGeometry(0.5, 0.35);
        const mirrorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.1,
            metalness: 0.9,
            side: THREE.DoubleSide
        });
        
        // First diagonal mirror
        const mirror1 = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        mirror1.position.set(0, 0.4, 0);
        mirror1.rotation.y = Math.PI / 4;
        this.mesh.add(mirror1);
        
        // Second diagonal mirror (perpendicular to first)
        const mirror2 = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        mirror2.position.set(0, 0.4, 0);
        mirror2.rotation.y = -Math.PI / 4;
        this.mesh.add(mirror2);

        this.type = 'Scarab';
    }

    setPosition(x, z) {
        this.mesh.position.x = x;
        this.mesh.position.z = z;
    }

    rotateY(angle) {
        this.mesh.rotation.y = angle;
    }
}