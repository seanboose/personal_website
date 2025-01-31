var rawbones = [];


class Prism {

	constructor(radius){
		var trig = radius * 0.70710678;
		var prism_material = new THREE.LineBasicMaterial({color: 0x00ffff});

		this.disk_verts = [];
		this.disk_verts.push(new THREE.Vector3(0, radius,   0,      1));
		this.disk_verts.push(new THREE.Vector3(0, trig,     trig,   1));
		this.disk_verts.push(new THREE.Vector3(0, 0,        radius, 1));
		this.disk_verts.push(new THREE.Vector3(0, -trig,    trig,   1));
		this.disk_verts.push(new THREE.Vector3(0, -radius,  0,      1));
		this.disk_verts.push(new THREE.Vector3(0, -trig,   -trig,   1));
		this.disk_verts.push(new THREE.Vector3(0, 0,       -radius, 1));
		this.disk_verts.push(new THREE.Vector3(0, trig,    -trig,   1));
		this.disk_verts.push(new THREE.Vector3(0, radius,   0,      1));

		this.disk_geom = [];
		this.disk_line = [];
		for(var i=0; i<2; ++i){
			this.disk_geom.push(new THREE.Geometry());
			this.disk_line.push(new THREE.Line());
			this.disk_line[i].material = prism_material;
		}

		this.wall_geom = [];
		this.wall_line = [];
		for(var i=0; i<8; ++i){
			this.wall_geom.push(new THREE.Geometry());
			this.wall_line.push(new THREE.Line());
			this.wall_line[i].material = prism_material;
		}


		this.axes_vert_0 = [new THREE.Vector4(0,  0,  0, 1),
							new THREE.Vector4(0, .1,  0, 1)];
		this.axes_vert_1 = [new THREE.Vector4(0,  0,  0, 1),
							new THREE.Vector4(0,  0, .1, 1)];
		this.axes_geom_0 = new THREE.Geometry();
		this.axes_geom_1 = new THREE.Geometry();
		this.axes_line_0 = new THREE.Line();
		this.axes_line_1 = new THREE.Line();
		var axes_material_0 = new THREE.LineBasicMaterial({color: 0xff0000});
		var axes_material_1 = new THREE.LineBasicMaterial({color: 0x0000ff});
		this.axes_line_0.material = axes_material_0;
		this.axes_line_1.material = axes_material_1;

	};

	addLinesToScene(scene){
		scene.add(this.disk_line[0]);
		scene.add(this.disk_line[1]);

		for(var i=0; i<this.wall_line.length; ++i){
			scene.add(this.wall_line[i]);
		}

		scene.add(this.axes_line_0);
		scene.add(this.axes_line_1);
	};

	setVisible(bool){

		for(var i=0; i<this.disk_line.length; ++i){
			this.disk_line[i].visible = bool;
		}
		for(var i=0; i<this.wall_line.length; ++i){
			this.wall_line[i].visible = bool;
		}

		this.axes_line_0.visible = bool;
		this.axes_line_1.visible = bool;
	};

}


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

function parseWeightsFile(text, doot){
	console.log("Parsing weights file...");

	var line_num = 0;
	var lines = text.split("\n");

	var first_line = lines[0].split(" ");
	console.log(first_line);
	var num_bones = parseInt(first_line[0]);
	var num_verts = parseInt(first_line[1]);
	var bone_num = 0;
	var vert_num = 0;

	for(var i=1; i < lines.length-1; ++i){
		doot.bone_vector[bone_num].weights.push(parseFloat(lines[i]));
		++vert_num;
		if(vert_num == num_verts){
			vert_num = 0;
			++bone_num;
		}
	}

	console.log("Parsed weights file.");
}


// Convert the bones file into an array of RawBones
function parseBoneFile(text){
	console.log("Parsing bone file...");

	var line_num = 0;
	var lines = text.split("\n");

	var rawbones = [];

	for(var i=0; i<lines.length-1; ++i){
		// Parse an individual line
		line = lines[i].split(" ");

		var id = line[0];
		var parent = line[1];
		var dx = line[2];
		var dy = line[3];
		var dz = line[4];

		rawbones.push(new RawBone(id, parent, dx, dy, dz));
	}

	return rawbones;
}
