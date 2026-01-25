import * as THREE from 'three';

export class Sphinx {
    constructor(color = 0x0000ff) {
        const geometry = new THREE.BoxGeometry(0.7, 0.5, 0.7);
        const material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.25;
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
