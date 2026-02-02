import * as THREE from 'three';

export class Scarab {
    constructor(color = 0x00ff00) {
        this.mesh = new THREE.Group();
        
        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(0.35, 0.38, 0.1, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(0.7),
            roughness: 0.5,
            metalness: 0.4
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.05;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // Main body - beetle-shaped
        const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.4,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1, 0.6, 1);
        body.position.y = 0.22;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // X-shaped mirror configuration (two perpendicular diagonal mirrors)
        const mirrorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDDDCC5,  // Light cream
            roughness: 0.05,
            metalness: 0.97,
            side: THREE.DoubleSide,
            emissive: 0xAAAFBA,
            emissiveIntensity: 0.15
        });
        
        // First diagonal mirror (45 degrees)
        const mirror1Geometry = new THREE.PlaneGeometry(0.55, 0.4);
        const mirror1 = new THREE.Mesh(mirror1Geometry, mirrorMaterial);
        mirror1.position.set(0, 0.42, 0);
        mirror1.rotation.y = Math.PI / 4;
        this.mesh.add(mirror1);
        
        // Second diagonal mirror (perpendicular to first)
        const mirror2Geometry = new THREE.PlaneGeometry(0.55, 0.4);
        const mirror2 = new THREE.Mesh(mirror2Geometry, mirrorMaterial);
        mirror2.position.set(0, 0.42, 0);
        mirror2.rotation.y = -Math.PI / 4;
        this.mesh.add(mirror2);
        
        // Decorative scarab wings (subtle)
        const wingGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.25);
        const wingMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(1.2),
            roughness: 0.3,
            metalness: 0.6
        });
        
        const wingLeft = new THREE.Mesh(wingGeometry, wingMaterial);
        wingLeft.position.set(-0.22, 0.22, 0);
        wingLeft.rotation.z = -0.2;
        this.mesh.add(wingLeft);
        
        const wingRight = new THREE.Mesh(wingGeometry, wingMaterial);
        wingRight.position.set(0.22, 0.22, 0);
        wingRight.rotation.z = 0.2;
        this.mesh.add(wingRight);

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