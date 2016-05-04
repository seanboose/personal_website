var bone_text;
var skeleton = new Skeleton(0,0,0);
var renderer = new THREE.WebGLRenderer({ antialias: true });
var scene = new THREE.Scene;
var bone_material = new THREE.LineBasicMaterial({color: 0xff00ff});

function onBoneFileLoaded(){
	bone_text = this.responseText;
}

// function mat4XVec4(m, v){
// 	var v0 = m[0]*v[0] + m[4]*v[1] + m[8]*v[2]  + m[12]*v[3];
// 	var v1 = m[1]*v[0] + m[5]*v[1] + m[9]*v[2]  + m[13]*v[3];
// 	var v2 = m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]*v[3];
// 	var v3 = m[3]*v[0] + m[7]*v[1] + m[11]*v[2] + m[15]*v[3];

// 	// return vec4.fromValues(v0,v1,v2,v3);
// 	return new THREE.Vector4(v0, v1, v2, v3);
// }

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
	 
	// Create camera
	var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
	camera.position.set(0,0,2);
	camera.lookAt(new THREE.Vector3(0,0,0));

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