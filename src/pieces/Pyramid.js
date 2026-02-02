import * as THREE from 'three';

export class Pyramid {
    constructor(color = 0xffff00) {
        this.mesh = new THREE.Group();
        
        // Base platform (square)
        const baseGeometry = new THREE.BoxGeometry(0.65, 0.08, 0.65);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(0.7),
            roughness: 0.5,
            metalness: 0.4
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.04;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // Main pyramid body - aligned to grid
        const pyramidGeometry = new THREE.ConeGeometry(0.32, 0.5, 4);
        const pyramidMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.4,
            metalness: 0.35,
            transparent: true,
            opacity: 0.95
        });
        const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
        pyramid.position.y = 0.33;
        pyramid.rotation.y = Math.PI / 4; // Align edges to axes
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        this.mesh.add(pyramid);

        // Diagonal mirror face (prominent, reflective)
        // Create triangle geometry for one face
        const mirrorGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0.5, 0,      // Top vertex
            -0.226, 0, 0.226,  // Bottom left
            0.226, 0, 0.226   // Bottom right
        ]);
        mirrorGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        mirrorGeometry.computeVertexNormals();
        
        const mirrorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDDDCC5,  // Light cream
            roughness: 0.05,
            metalness: 0.98,
            side: THREE.DoubleSide,
            emissive: 0xAAAFBA,
            emissiveIntensity: 0.1
        });
        const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        mirror.position.y = 0.08;
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