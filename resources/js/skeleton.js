var bone_text;
var skeleton = new Skeleton(0,0,0);
var renderer = new THREE.WebGLRenderer({ antialias: true });
var scene = new THREE.Scene;
var bone_material = new THREE.LineBasicMaterial({color: 0xff00ff});
var selected_material = new THREE.LineBasicMaterial({color: 0x00ff00});


var camera_distance = 2;
var rotation_speed = 0.05;
var eye  = new THREE.Vector3(0, 0.1, camera_distance);
var up   = new THREE.Vector3(0, 1, 0);
var look = new THREE.Vector3(0, 0, 1);
var tangent = new THREE.Vector3().crossVectors(up, look);
var center = look.clone().multiplyScalar(camera_distance).add(eye);
var orientation = new THREE.Matrix3();
orientation.set(
	tangent.x, up.x, look.x,
	tangent.y, up.y, look.y,
	tangent.z, up.z, look.z);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.0001, 1000);
camera.position.set(0,0,camera_distance);
camera.lookAt(look);


var kCylinderRadius = 0.05;
var selected_id = -2;

var mousedown = false;
document.body.onmousedown = function() {
	mousedown = true;
}
document.body.onmouseup = function() {
 	mousedown = false;
}

var raycaster = new THREE.Raycaster();
raycaster.linePrecision = .05;
var mouse = new THREE.Vector2();
var last_mouse = new THREE.Vector2();

document.onmousemove = handleMouseMove;
function handleMouseMove(event) {

	for(var i = 0; i < skeleton.bone_objects.children.length; ++i){
		skeleton.bone_objects.children[i].geometry.verticesNeedUpdate = true;

		// console.log(skeleton.bone_objects.children[i].geometry.vertices);
		// console.log(skeleton.bone_vector[i].geom.vertices);
	}


	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	

	var delta_x = mouse.x - last_mouse.x;
	var delta_y = mouse.y - last_mouse.y;

	if(Math.sqrt(delta_x * delta_x + delta_y * delta_y) < 1e-15) return;
	
	if(mousedown){
		if(selected_id != -2){
			var axis = new THREE.Vector3(0, delta_x, delta_y).applyMatrix3(orientation);
			axis.normalize();
			var rotation = new THREE.Matrix4().makeRotationAxis(axis, rotation_speed);
			for(var i=0; i<skeleton.bone_vector.length; ++i){
				if(skeleton.bone_vector[i].line.id == selected_id){
					skeleton.bone_vector[i].si.multiply(rotation);
				}
			}
		}
	}
	else {
		raycaster.setFromCamera(mouse, camera);
		var intersects = raycaster.intersectObjects(skeleton.bone_objects.children);
		if(intersects.length > 0)
			selected_id = intersects[0].object.id;
		else
			selected_id = -2;

	}

	last_mouse.x = mouse.x;
	last_mouse.y = mouse.y;
}

function onBoneFileLoaded(){
	bone_text = this.responseText;
}


function drawBone(bone, trans){

	var p0 = new THREE.Vector4(0,0,0,1);
	p0.applyMatrix4(bone.ti);
	p0.applyMatrix4(trans);

	var p1 = new THREE.Vector4(bone.l, 0, 0, 1);
	p1.applyMatrix4(bone.si);
	p1.applyMatrix4(bone.ti);
	p1.applyMatrix4(trans);

	var p0v = new THREE.Vector3(p0.x, p0.y, p0.z);
	var p1v = new THREE.Vector3(p1.x, p1.y, p1.z);

	var verts = [p0v, p1v];
	bone.geom.vertices = verts;
	bone.geom.verticesNeedUpdate = true;
	bone.geom.boundingSphere = null;
	bone.geom.boundingBox = null;
	bone.line.geometry = bone.geom;
	if(bone.line.id == selected_id) bone.line.material = selected_material;
	else bone.line.material = bone_material;
	bone.line.material.needsUpdate = true;

	var temp_trans = new THREE.Matrix4().multiplyMatrices(bone.ti, bone.si);
	var new_trans = new THREE.Matrix4().multiplyMatrices(trans, temp_trans);

	var new_trans = bone.si.clone();
	new_trans.premultiply(bone.ti);
	new_trans.premultiply(trans);

	for(var i=0; i<bone.children.length; ++i){
		drawBone(bone.children[i], new_trans);
	}
}

function drawSkeleton(){

	// Draw bones!
	for(var i=0; i<skeleton.children.length; ++i){
		drawBone(skeleton.children[i], new THREE.Matrix4());
	}
}

function init(){
	console.log("Initializing WebGl/three.js stuff...");

	var width = window.innerWidth;
	var height = window.innerHeight;

	// Set up renderer
	renderer.setSize(width, height);
	document.body.appendChild(renderer.domElement);
	 
	scene.add(camera);

	// Add a light
	var pointLight = new THREE.PointLight(0xffffff);
	pointLight.position.set(0, 300, 200);
	 
	scene.add(pointLight);

	// Add skybox
	var skyboxGeometry = new THREE.CubeGeometry(1000, 1000, 1000);
	var skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0xff99cc, side: THREE.BackSide});
	var skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
	scene.add(skybox);

	console.log("Loading bone file...");
	var xml_request = new XMLHttpRequest();
	var bone_address = "resources/ogre-files/ogre-skeleton.bf";
	rawbones
	xml_request.addEventListener("load", onBoneFileLoaded);
	xml_request.open("GET", bone_address, false);
	xml_request.send();
	console.log("Bone file loaded.");

	var rawbones = parseBoneFile(bone_text);
	console.log("Returned bones length: " + rawbones.length);
	skeleton = createSkeletonFromRawBones(rawbones);
	scene.add(skeleton.bone_objects);
	console.log("Created skeleton?");

	// Load ogre, extract the mesh from weird obj object hierarchy bullshit
	var ogre;
	var ogre_loaded = false;
	console.log("Loading ogre obj...");
	var loader = new THREE.OBJLoader();
	loader.load( 'resources/ogre-files/ogre.obj', function ( object ) {
		var material = new THREE.MeshPhongMaterial( { color: 0x00ff00} );
		console.log(material.opacity);
		object.traverse( function ( child ) {
		if ( child instanceof THREE.Mesh ) {
			ogre = child;
			ogre_loaded = true;
			ogre.material = material;
			ogre.material.opacity = .5;
			ogre.material.transparent = true;
			scene.add(ogre);
			console.log("Ogre loaded.");
		}
		});
	});


	render();

	function render(){
		drawSkeleton();

		if(ogre_loaded){
			// Do ogre thangs
		}

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}
}


init();