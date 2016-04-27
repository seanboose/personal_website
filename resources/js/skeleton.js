var width = window.innerWidth;
var height = window.innerHeight;

// Set up renderer
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);
 
var scene = new THREE.Scene;

// Create a cube
var cubeGeometry = new THREE.CubeGeometry(100, 100, 100);
var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x1ec876 });
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
 
cube.rotation.y = Math.PI * 45 / 180;
 
scene.add(cube);

// Create camera
var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
camera.position.y = 160;
camera.position.z = 400;
camera.lookAt(cube.position);

scene.add(camera);

// Add a light
var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(0, 300, 200);
 
scene.add(pointLight);
 
renderer.render(scene, camera);