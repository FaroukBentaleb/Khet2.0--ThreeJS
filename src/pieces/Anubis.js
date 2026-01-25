import * as THREE from 'three';
export class Anubis {
    constructor(color = 0xffa500) {
        const geometry = new THREE.BoxGeometry(0.7, 0.5, 0.4);
        const material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.25;
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
