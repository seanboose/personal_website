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


var last_x = 0;
var last_y = 0;
var current_x = 0;
var current_y = 0;
var mouse_ray = new THREE.Vector3();
var kCylinderRadius = 0.05;
var selected_id = -2;

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

		console.log("x: " + x);
		console.log("y: " + y)
		mouse_ray = new THREE.Vector3(x, y, z);
		mouse_ray.unproject(camera);
		mouse_ray.normalize();

		console.log(mouse_ray);

		// Draw the ray
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

var first_select = true;
function selectBone(bone, trans){
	var dist = Number.MAX_VALUE;

	var p0 = new THREE.Vector4(0,0,0,1);
	p0.applyMatrix4(bone.ti);
	p0.applyMatrix4(trans);

	var p1 = new THREE.Vector4(bone.l, 0, 0, 1);
	p1.applyMatrix4(bone.si);
	p1.applyMatrix4(bone.ti);
	p1.applyMatrix4(trans);

	var bone_pos = new THREE.Vector3(p0.x, p0.y, p0.z);
	var bone_ray = new THREE.Vector3(p1.x, p1.y, p1.z)
	bone_ray.sub(bone_pos);

	var w0 = eye.clone().sub(bone_pos);

	var a = mouse_ray.dot(mouse_ray);
	var b = mouse_ray.dot(bone_ray);
	var c = bone_ray.dot(bone_ray);
	var d = mouse_ray.dot(w0);
	var e = bone_ray.dot(w0);

	var denom = a*c - b*b;
	var sc = (b*e - c*d) / denom;
	var tc = (a*e - b*d) / denom;

	var mouse_closest = eye.clone().add(mouse_ray.clone().multiplyScalar(sc));
	var bone_closest = bone_pos.clone().add(bone_ray.clone().multiplyScalar(tc));
	var shortest_vec = mouse_closest.clone().sub(bone_closest);

	var delta = shortest_vec.length();

	if(delta < kCylinderRadius){
		var mouse_segment = mouse_closest.clone().sub(bone_pos);

		var mouse_comp = mouse_segment.dot(bone_ray.clone().normalize());
		var bone_comp = bone_ray.length();

		if(mouse_comp * bone_comp >= 0 && mouse_comp < bone.l){
			// BONE IS BEING AIMED AT!
			dist = sc;
		}
	}

	var new_t = trans.clone().multiply(bone.ti).multiply(bone.si);
	var child_dist = Number.MAX_VALUE;

	for(var i=0; i<bone.children.length; ++i){
		child_dist = selectBone(bone.children[i], new_t);
	}

	if(dist < Number.MAX_VALUE && dist < child_dist) {
		selected_id = bone.id;
		// console.log("CHOSE A BONE, id:" + selected_id + " dist: " + dist);
	}

	return dist;

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

	var verts = [p0, p1];
	bone.geom.vertices = verts;
	bone.geom.verticesNeedUpdate = true;
	bone.line.geometry = bone.geom;
	bone.line.material = bone_material;

	scene.add(bone.line);

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

	// See if mouse is pointed at a bone
	for(var i=0; i<skeleton.children.length; ++i){
		selectBone(skeleton.children[i], new THREE.Matrix4());
	}
	first_select = false;

	// Draw bones!
	for(var i=0; i<skeleton.children.length; ++i){
		if(first)console.log("drawing root bone " + i +" "+ skeleton.children.length);
		drawBone(skeleton.children[i], new THREE.Matrix4());
	}
	first=false;
}

function clearScene(){

	for( var i = scene.children.length - 1; i >= 0; i--) {
		var obj = scene.children[i];
		scene.remove(obj);
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
		selected_bone = -2;
		eye = look.clone().multiplyScalar(camera_distance).add(center);
		drawSkeleton();
		// cube.rotation.y -= clock.getDelta();

		renderer.render(scene, camera);
		requestAnimationFrame(render);

		// TODO: Might be able to remove both of these when done
		// Might not.
		clearScene();
		scene.add(skybox);

	}
}


init();