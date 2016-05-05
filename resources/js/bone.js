var rawbones = [];

class Bone {

	constructor (id, l, ti, ri, pid){
		this.id = id;
		this.pid = pid;
		this.l = l;
		this.children = [];
		this.line_id = -2;

		// Undeformed translation    from local to parent
		this.ti = ti.clone();
		// Undeformed rotation       from local to parent
		this.ri = ri.clone();
		// Deformed   rotation       from local to parent
		this.si = ri.clone();

		this.ui_set = false;
		// Undeformed transformation from local to world
		this.ui = new THREE.Matrix4();
		// Deformed   transformation from local to world
		this.di = new THREE.Matrix4();

		this.weights = [];

		this.geom = new THREE.Geometry();
		this.line = new THREE.Line();

	}
}




class RawBone {

	// int id, parent;
	// float dx, dy, dz;

	constructor (id, parent, dx, dy, dz) {
		this.id = id;
		this.parent = parent;
		this.dx = dx;
		this.dy = dy;
		this.dz = dz;
	}
}

class Skeleton {

	// glm::vec3 root;
	// std::list<Bone*> children;
	// std::vector<Bone*> bone_vector;

	constructor (x, y, z){
		this.children = [];
		this.bone_vector = [];
		// this.root = vec3.fromValues(x,y,z);
		this.root = new THREE.Vector3(x,y,z);

		this.bone_objects = new THREE.Object3D();

	}
}

function createSkeletonFromRawBones(rawbones){
	console.log("Creating skeleton");


	bones = [];
	for(var i=0; i<rawbones.length -1; ++i){
		bones.push(new Bone(-2, -2, new THREE.Matrix4(), new THREE.Matrix4(), -2));
	}

	var doot;

	for(var i=0; i<rawbones.length; ++i){
		var cid;
		var pid;
		var dx;
		var dy;
		var dz;

		var length;
		var bone_vec;
		var ti = new THREE.Matrix4();
		var ri = new THREE.Matrix4();

		var t_hat = new THREE.Vector3();
		var n_hat = new THREE.Vector3();
		var b_hat = new THREE.Vector3();

		var new_bone;


		child = rawbones[i];
		cid = child.id;

		if(cid == -1){
			doot = new Skeleton(child.dx, child.dy, child.dz);
			continue;
		}

		bone_vec = new THREE.Vector3(child.dx, child.dy, child.dz);
		length = bone_vec.length();

		parent = rawbones[child.parent];
		pid = parent.id;

		if(pid==-1){
			// Orphaned bone
			ti = new THREE.Matrix4().makeTranslation(doot.root.x, doot.root.y, doot.root.z);
		}
		else {
			// Regular-ass bone
			ti = new THREE.Matrix4().makeTranslation(bones[pid].l, 0, 0);
		}

		// Find coord axes (in world coords)
		t_hat = bone_vec.clone();
		t_hat.normalize()

		n_hat = determineNHat(t_hat);

		b_hat = new THREE.Vector3().crossVectors(t_hat, n_hat);
		b_hat.normalize();

		var tbn = new THREE.Matrix4().identity();

		// For some fucking reason, set is row-major and EVERYTHING ELSE
		// is column major. 
		tbn.set(
			t_hat.x, n_hat.x, b_hat.x, 0,
			t_hat.y, n_hat.y, b_hat.y, 0,
			t_hat.z, n_hat.z, b_hat.z, 0,
			0,       0,       0,       1);

	    // Find Ri from tbn
	    // R(0)...R(i-1)*R(i) = tbn
		var temp_pid = pid;
		while(temp_pid > -1){
			var prev_ri_inv = new THREE.Matrix4();
			prev_ri_inv.getInverse(bones[temp_pid].ri);
			ri.multiply(prev_ri_inv);
			temp_pid = bones[temp_pid].pid;
		}


	    // R(i) = R(i-1)T*...*R(0)T*tbn
		ri.multiply(tbn);

		// Create a bone, add to parent appropriately
		new_bone = new Bone(cid, length, ti, ri, pid);
		doot.bone_objects.add(new_bone.line);
		bones[cid] = new_bone;
		if(pid == -1) doot.children.push(new_bone);
		else bones[pid].children.push(new_bone);

		console.log("BONE ID:" + cid);
		console.log(ri);
	}

	doot.bone_vector = bones;
	return doot;

}

function determineNHat(t_hat){

	var nV = t_hat.clone();

	var min = Math.abs(t_hat.x);
	if(min > Math.abs(t_hat.y)) min = Math.abs(t_hat.y);
	if(min > Math.abs(t_hat.z)) min = Math.abs(t_hat.z);

	nV.x = (Math.abs(nV.x) == min) ? 1 : 0;
	nV.y = (Math.abs(nV.y) == min) ? 1 : 0;
	nV.z = (Math.abs(nV.z) == min) ? 1 : 0;

	var n_hat = new THREE.Vector3()
	n_hat.crossVectors(t_hat, nV);
	n_hat.normalize();

	return n_hat;
}


// Convert the bones file into an array of RawBones
function parseBoneFile(text){
	console.log("Parsing bone file...");

	var line_num = 0;
	var lines = text.split("\n");
	console.log(lines);
	console.log("Number of lines in file: " + lines.length);

	var rawbones = [];

	for(var i=0; i<lines.length-1; ++i){
		// Parse an individual line
		line = lines[i].split(" ");
		console.log(line);

		var id = line[0];
		var parent = line[1];
		var dx = line[2];
		var dy = line[3];
		var dz = line[4];

		rawbones.push(new RawBone(id, parent, dx, dy, dz));
	}

	console.log("Nunber of bones extracted: " + rawbones.length);
	console.log("(There's a blank line at the end of the file)");

	return rawbones;
}



























