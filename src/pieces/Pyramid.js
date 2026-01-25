import * as THREE from 'three';
export class Pyramid {
    constructor(color = 0xffff00) {
        const geometry = new THREE.ConeGeometry(0.4, 0.5, 4); // square base
        const material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.25;
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