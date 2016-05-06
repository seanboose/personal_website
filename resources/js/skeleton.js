var bone_text;
var weight_text;
var skeleton = new Skeleton(0,0,0);
var renderer = new THREE.WebGLRenderer({ antialias: true });
var scene = new THREE.Scene;
var ogre;
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
var prism = new Prism(kCylinderRadius);
prism.addLinesToScene(scene);

var mousedown = false;
document.body.onmousedown = function() {
	mousedown = true;
}
document.body.onmouseup = function() {
 	mousedown = false;
}
document.onkeypress = function (e) {
    e = e || window.event;

    // Rotate bones with left/right
	if(e.keyCode == 37 || e.keyCode == 39){
	    if(selected_id != -2 && mousedown){
    		var rot_dir = 1;
    		if(e.keyCode == 39) rot_dir = -1;
    		var rot_axis = new THREE.Vector3(-1, 0, 0);
    		var rot_matrix = new THREE.Matrix4().makeRotationAxis(rot_axis, rot_dir * rotation_speed);

    		// Find the correct bone
    		var rot_bone;
    		for(var i=0; i<skeleton.bone_vector.length; ++i){
    			if(skeleton.bone_vector[i].line.id == selected_id){
    				rot_bone = skeleton.bone_vector[i];
    				break;
    			}
    		}
    		rot_bone.si.multiply(rot_matrix);

    	}
    }
};

var raycaster = new THREE.Raycaster();
raycaster.linePrecision = .05;
var mouse = new THREE.Vector2();
var last_mouse = new THREE.Vector2();

document.onmousemove = handleMouseMove;
function handleMouseMove(event) {

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
		if(intersects.length > 0) {
			selected_id = intersects[0].object.id;
			prism.setVisible(true);
		}
		else {
			selected_id = -2;
			prism.setVisible(false);
		}

	}

	last_mouse.x = mouse.x;
	last_mouse.y = mouse.y;
}

function onBoneFileLoaded(){
	bone_text = this.responseText;
}
function onWeightFileLoaded(){
	weight_text = this.responseText;
}

function drawPrism(bone, trans){

	var disk_0_verts = [];
	var disk_1_verts = [];

	for(var i=0; i<prism.disk_verts.length; ++i){
		var vert0 = prism.disk_verts[i].clone();
		vert0.applyMatrix4(trans);
		disk_0_verts.push(new THREE.Vector3(vert0.x, vert0.y, vert0.z));

		var vert1 = prism.disk_verts[i].clone();
		vert1.x = vert1.x + bone.l;
		vert1.applyMatrix4(trans);
		disk_1_verts.push(new THREE.Vector3(vert1.x, vert1.y, vert1.z));

		if(i < prism.wall_line.length){
			prism.wall_geom[i].vertices = [new THREE.Vector3(vert0.x, vert0.y, vert0.z),
										   new THREE.Vector3(vert1.x, vert1.y, vert1.z)];
			prism.wall_geom[i].verticesNeedUpdate = true;
			prism.wall_line[i].geometry = prism.wall_geom[i];
		}
	}

	prism.disk_geom[0].vertices = disk_0_verts;
	prism.disk_geom[1].vertices = disk_1_verts;
	prism.disk_geom[0].verticesNeedUpdate = true;
	prism.disk_geom[1].verticesNeedUpdate = true;
	prism.disk_line[0].geometry = prism.disk_geom[0];
	prism.disk_line[1].geometry = prism.disk_geom[1];


	axis_0_verts = [];
	axis_1_verts = [];
	for(var i=0; i<prism.axes_vert_0.length; ++i){
		var axis_0 = prism.axes_vert_0[i].clone();
		var axis_1 = prism.axes_vert_1[i].clone();
		axis_0.applyMatrix4(trans);
		axis_1.applyMatrix4(trans);
		axis_0_verts.push(new THREE.Vector3(axis_0.x, axis_0.y, axis_0.z));
		axis_1_verts.push(new THREE.Vector3(axis_1.x, axis_1.y, axis_1.z));
	}
	prism.axes_geom_0.vertices = axis_0_verts;
	prism.axes_geom_1.vertices = axis_1_verts;
	prism.axes_geom_0.verticesNeedUpdate = true;
	prism.axes_geom_1.verticesNeedUpdate = true;
	prism.axes_line_0.geometry = prism.axes_geom_0;
	prism.axes_line_1.geometry = prism.axes_geom_1;


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
	if(bone.line.id == selected_id) {
		drawPrism(bone, trans.clone().multiply(bone.ti).multiply(bone.si));
		bone.line.material = selected_material;
	}
	else {
		bone.line.material = bone_material;
	}
	bone.line.material.needsUpdate = true;

	var temp_trans = new THREE.Matrix4().multiplyMatrices(bone.ti, bone.si);
	var new_trans = new THREE.Matrix4().multiplyMatrices(trans, temp_trans);

	var new_trans = bone.si.clone();
	new_trans.premultiply(bone.ti);
	new_trans.premultiply(trans);

	if(!bone.ui_set){
		bone.ui_set = true;
		bone.ui = new_trans.clone();
	}
	else {
		bone.di = new_trans.clone();
	}

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


var empty_ogre_vertices;
var init_ogre_vertices;
var first_ogre = true;
function createEmptyOgreVertices(){
	empty_ogre_vertices = [];
	for(var i=0; i<ogre.geometry.vertices.length; ++i){
		empty_ogre_vertices.push(new THREE.Vector3());
	}
}

function drawOgre() {

	if(first_ogre){
		first_ogre = false;
		createEmptyOgreVertices()
	}

	var new_vertices = empty_ogre_vertices.slice(0);


	for(var i=0; i<skeleton.bone_vector.length; ++i){
		var bone = skeleton.bone_vector[i];

		var trans = new THREE.Matrix4().getInverse(bone.ui).premultiply(bone.di);

		var weights = bone.weights;
		// for(var j=0; j<weights.length; ++j){
		// 	var vert = init_ogre_vertices[j].clone();
		// 	vert.applyMatrix3(trans);
		// 	vert.multiplyScalar(weights[j]);
		// 	new_vertices[i].add(vert);
		// }
	}

	// ogre.geometry.vertices = new_vertices;
	// ogre.geometry.verticesNeedUpdate = true;
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
	var bone_request = new XMLHttpRequest();
	var bone_address = "resources/ogre-files/ogre-skeleton.bf";
	bone_request.addEventListener("load", onBoneFileLoaded);
	bone_request.open("GET", bone_address, false);
	bone_request.send();
	console.log("Bone file loaded.");

	console.log("Loading weights file...");
	var weights_address = "resources/ogre-files/ogre-weights.dmat";
	var weights_request = new XMLHttpRequest();
	weights_request.addEventListener("load", onWeightFileLoaded);
	weights_request.open("GET", weights_address, false);
	weights_request.send();
	console.log("Weights file loaded.");	

	var rawbones = parseBoneFile(bone_text);
	console.log("Returned bones length: " + rawbones.length);
	skeleton = createSkeletonFromRawBones(rawbones);
	scene.add(skeleton.bone_objects);
	console.log("Skeleton complete.");

	parseWeightsFile(weight_text, skeleton);


	// Load ogre, extract the mesh from weird obj object hierarchy bullshit
	var ogre_loaded = false;
	console.log("Loading ogre obj...");
	var loader = new THREE.OBJLoader();
	loader.load( 'resources/ogre-files/ogre.obj', function ( object ) {
		var material = new THREE.MeshPhongMaterial( { color: 0x00ff00} );
		object.traverse( function ( child ) {
		if ( child instanceof THREE.Mesh ) {
			ogre = child;
			ogre_loaded = true;
			ogre.material = material;
			ogre.material.opacity = .5;
			ogre.material.transparent = true;
			ogre.geometry = new THREE.Geometry().fromBufferGeometry(ogre.geometry);
			init_ogre_vertices = ogre.geometry.vertices;
			scene.add(ogre);
			console.log("Ogre loaded.");
		}
		});
	});


	render();

	function render(){
		if(!ogre_loaded){
			requestAnimationFrame(render);
			return;
		}

		drawSkeleton();
		drawOgre();

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}
}

init();