import * as THREE from 'three';

export class Sphinx {
    constructor(color = 0x0000ff) {
        this.mesh = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.7);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.4,
            metalness: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.25;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Laser emitter (direction indicator) - front face
        const emitterGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.15);
        const emitterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });
        const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
        emitter.position.set(0, 0.25, 0.425);
        emitter.castShadow = true;
        this.mesh.add(emitter);

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