import * as THREE from 'three';

export class Scarab {
    constructor(color = 0x00ff00) {
        const geometry = new THREE.BoxGeometry(0.6, 0.5, 0.6);
        const material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.25;
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