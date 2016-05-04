var bone_text;
var skeleton = new Skeleton(0,0,0);
var renderer = new THREE.WebGLRenderer({ antialias: true });
var scene = new THREE.Scene;
var bone_material = new THREE.LineBasicMaterial({color: 0xff00ff});


var camera_distance = 2;
var rotation_speed = 0.05;
var eye  = new THREE.Vector3(0, 0.1, camera_distance);
var up   = new THREE.Vector3(0, 1, 0);
var look = new THREE.Vector3(0, 0, 1);
var tangent = new THREE.Vector3().crossVectors(up, look);
var orientation = new THREE.Matrix3();
orientation.set(
	tangent.x, up.x, look.x,
	tangent.y, up.y, look.y,
	tangent.z, up.z, look.z);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0,0,camera_distance);
camera.lookAt(look);


var last_x = 0;
var last_y = 0;
var current_x = 0;
var current_y = 0;
var mouse_ray = new THREE.Vector3();

var mousedown = false;
document.body.onmousedown = function() { 
  mousedown = true;
}
document.body.onmouseup = function() {
  mousedown = false;
}

document.onmousemove = handleMouseMove;
function handleMouseMove(event) {

	last_x = current_x;
	last_y = current_y;
	current_x = event.pageX;
	current_y = event.pageY;
	console.log("Mouse moved: " + current_x + " " + current_y);

	var delta_x = current_x - last_x;
	var delta_y = current_y - last_y;
	if(Math.sqrt(delta_x * delta_x + delta_y * delta_y) < 1e-15) return;

	var mouse_direction = new THREE.Vector3(delta_x, delta_y, 0);
	var mouse_start = new THREE.Vector2(last_x, last_y);
	var mouse_end = new THREE.Vector2(current_x, current_y);

	var viewport = new THREE.Vector4(0,0, window.innerWidth, window.innerHeight);

	if(mousedown){
		var axis_vector = new THREE.Vector3(0, mouse_directon.x, -mouse_directon.y);
		var axis = new THREE.Vector3().multiplyVectors(orientation, axis_vector);
		axis.normalize();

		var rotation = new THREE.Matrix4().makeRotationAxis(axis, rotation_speed);

		if(selected_bone != null){
			selected_bone.si = selected_bone.si.multiply(rotation);
		}
	}
	else {
		var x =  2 * current_x / window.innerWidth - 1;
		var y = -2 * current_y / window.innerHeight + 1;
		var z = -1;

		mouse_ray = new THREE.Vector3(x, y, z);
		mouse_ray.unproject(camera);
		mouse_ray.normalize();

		var p0 = mouse_ray.clone();
		var p1 = mouse_ray.clone().multiplyScalar(1000);
		var geom = new THREE.Geometry();
		geom.vertices.push(p0);
		geom.vertices.push(p1);
		var line = new THREE.Line(geom, bone_material);
		scene.add(line);
	}
}

function onBoneFileLoaded(){
	bone_text = this.responseText;
}

var first = false;
function drawBone(bone, trans){

	var p0 = new THREE.Vector4(0,0,0,1);
	p0.applyMatrix4(bone.ti);
	p0.applyMatrix4(trans);

	var p1 = new THREE.Vector4(bone.l, 0, 0, 1);
	p1.applyMatrix4(bone.si);
	p1.applyMatrix4(bone.ti);
	p1.applyMatrix4(trans);


	var geom = new THREE.Geometry();
	geom.vertices.push(new THREE.Vector3(p0.x, p0.y, p0.z))
	geom.vertices.push(new THREE.Vector3(p1.x, p1.y, p1.z))

	var line = new THREE.Line(geom, bone_material);
	scene.add(line);

	if(first){
		console.log("DRAWING id: " + bone.id);
		console.log(p0);
		console.log(p1);
	}

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

	for(var i=0; i<skeleton.children.length; ++i){
		if(first)console.log("drawing root bone " + i +" "+ skeleton.children.length);
		drawBone(skeleton.children[i], new THREE.Matrix4());
	}
	first=false;
}

function init(){
	console.log("Initializing WebGl/three.js stuff...");

	var width = window.innerWidth;
	var height = window.innerHeight;

	// Set up renderer
	renderer.setSize(width, height);
	document.body.appendChild(renderer.domElement);
	 
	// // Create camera
	// var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
	// camera.position.set(0,0,camera_distance);
	// camera.lookAt(look);

	scene.add(camera);

	// Add a light
	var pointLight = new THREE.PointLight(0xffffff);
	pointLight.position.set(0, 300, 200);
	 
	scene.add(pointLight);

	// Add skybox
	var skyboxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
	var skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0xff99cc, side: THREE.BackSide});
	var skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
	scene.add(skybox);

    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-10, 0, 0));
    geometry.vertices.push(new THREE.Vector3(0, 10, 0));
    geometry.vertices.push(new THREE.Vector3(10, 0, 0));
 	var line = new THREE.Line(geometry, material);
	scene.add(line)

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

	console.log("Created skeleton?");

	render();

	

	function render(){
		drawSkeleton();
		// cube.rotation.y -= clock.getDelta();

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}
}


init();