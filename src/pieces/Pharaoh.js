import * as THREE from 'three';

export class Pharaoh {
    constructor(color = 0xff0000) {
        const geometry = new THREE.BoxGeometry(0.8, 0.5, 0.8);
        const material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.25;
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