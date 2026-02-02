import * as THREE from 'three';

export class Pharaoh {
    constructor(color = 0xff0000) {
        this.mesh = new THREE.Group();
        
        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.1, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(0.7),
            roughness: 0.5,
            metalness: 0.5
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.05;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // Main body - taller, more imposing
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.32, 0.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.3,
            metalness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.35;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Head/headdress
        const headGeometry = new THREE.CylinderGeometry(0.25, 0.28, 0.25, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color).multiplyScalar(1.15),
            roughness: 0.25,
            metalness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.725;
        head.castShadow = true;
        this.mesh.add(head);

        // Crown (cream/gold color for both players)
        const crownGeometry = new THREE.ConeGeometry(0.2, 0.25, 8);
        const crownMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDDDCC5, // Light cream from palette
            roughness: 0.15,
            metalness: 0.95
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 0.975;
        crown.castShadow = true;
        this.mesh.add(crown);
        
        // Crown top ornament
        const orbGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const orb = new THREE.Mesh(orbGeometry, crownMaterial);
        orb.position.y = 1.1;
        orb.castShadow = true;
        this.mesh.add(orb);

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