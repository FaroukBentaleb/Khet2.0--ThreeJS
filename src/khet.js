import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { Pharaoh } from './pieces/Pharaoh';
import { Sphinx } from './pieces/Sphinx';
import { Scarab } from './pieces/Scarab';
import { Anubis } from './pieces/Anubis';
import { Pyramid } from './pieces/Pyramid';
export class khetGame {
    constructor() {
        //-----------------Scene & Camera
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x4A4E58);

        const camera = new THREE.PerspectiveCamera(
            75, innerWidth / innerHeight, 0.1, 1000
        );
        camera.position.set(0, 10, 5);
        camera.lookAt(0, 0, 0);

        //-----------------Plane
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x0A0A0F, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);

        //-----------------Grid
        const boardSize = 10;
        const divisions = 10;
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0xD6D8DC });
        const gridGeometry = new THREE.BufferGeometry();
        const points = [];
        for (let i = 0; i <= divisions; i++) {
            const offset = -boardSize / 2 + i;
            points.push(offset, 0.01, -boardSize / 2, offset, 0.01, boardSize / 2);
            points.push(-boardSize / 2, 0.01, offset, boardSize / 2, 0.01, offset);
        }
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
        scene.add(gridLines);

        //-----------------Lights
        // Ambient light for general brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Directional light like the sun
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        //-----------------Pieces
        //---------pharaoh
        const pharaoh = new Pharaoh();
        pharaoh.setPosition(-4.5, -4.5);
        scene.add(pharaoh.mesh);
        //---------sphinx
        const sphinx = new Sphinx();
        sphinx.setPosition(-4.5, 0.5);
        scene.add(sphinx.mesh);
        //---------scarab
        const scarab = new Scarab();
        scarab.setPosition(-4.5, 1.5);
        scene.add(scarab.mesh);
        //---------scarab
        const anubis = new Anubis();
        anubis.setPosition(-4.5, 2.5);
        scene.add(anubis.mesh);
        //---------scarab
        const pyramid = new Pyramid();
        pyramid.setPosition(-4.5, 4.5);
        scene.add(pyramid.mesh);
        //-----------------Renderer & Controls
        const render = new THREE.WebGLRenderer();
        render.setSize(innerWidth, innerHeight);
        document.body.appendChild(render.domElement);

        const controls = new OrbitControls(camera, render.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        //-----------------Animate
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            render.render(scene, camera);
        };
        animate();
    }
}
