import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
export class khetGame {
    constructor(){
        //-----------------Sceen & Camera
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x4A4E58);
        const camera = new THREE.PerspectiveCamera(
            75, innerWidth/innerHeight, 0.1, 1000
        );
        camera.position.set(0, 10, 5);
        camera.lookAt(0, 0, 0); 
        //-----------------Plane
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x0A0A0F, side: THREE.DoubleSide})
        const plane = new THREE.Mesh( geometry, material );
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);
        //-----------------Division to 100 squares
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
        //--------------------------------------------------------
        const render = new THREE.WebGLRenderer();
        render.setSize(innerWidth, innerHeight);

        document.body.appendChild(render.domElement);
        render.render(scene, camera);
    }
}