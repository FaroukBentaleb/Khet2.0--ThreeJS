import * as THREE from 'three';

export class Pyramid {
    constructor(color = 0xffff00) {
        this.mesh = new THREE.Group();
        
        // Main pyramid body - using cone with 4 sides for square base
        const pyramidGeometry = new THREE.ConeGeometry(0.35, 0.5, 4);
        const pyramidMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.4,
            metalness: 0.3
        });
        const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
        pyramid.position.y = 0.25;
        pyramid.rotation.y = Math.PI / 4; // Rotate to align with grid
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        this.mesh.add(pyramid);

        // Mirror face indicator (one diagonal face)
        const mirrorGeometry = new THREE.PlaneGeometry(0.4, 0.4);
        const mirrorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xdddddd,
            roughness: 0.1,
            metalness: 0.95,
            side: THREE.DoubleSide
        });
        const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        mirror.position.set(0.15, 0.25, 0.15);
        mirror.rotation.y = -Math.PI / 4;
        mirror.rotation.x = Math.PI / 6;
        this.mesh.add(mirror);

        this.type = 'Pyramid';
    }

    setPosition(x, z) {
        this.mesh.position.x = x;
        this.mesh.position.z = z;
    }

    rotateY(angle) {
        this.mesh.rotation.y = angle;
    }
}