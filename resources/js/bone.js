var rawbones = [];

class Bone {

	// int id;
	// int pid;
	// float l;
	// std::list<Bone*> children;

	// // Undeformed translation    from local to parent
	// glm::mat4 ti;
	// // Undeformed rotation       from local to parent
	// glm::mat4 ri;
	// // Deformed   rotation       from local to parent
	// glm::mat4 si;

	// // Undeformed transformation from local to world
	// bool ui_set = false;
	// glm::mat4 ui;
	// // Deformed   transformation from local to world
	// glm::mat4 di;

	// std::vector<glm::vec4> vertices;
    // std::vector<glm::uvec2> indices;
    // GLuint VAO, VBO, EBO;

    // std::vector<float> weights;

	constructor (id, l, ti, ri, pid){
		this.id = id;
		this.pid = pid;
		this.l = l;
		this.children = [];

		this.ti = mat4.clone(ti);
		this.ri = mat4.clone(ri);
		this.si = mat4.clone(ri);

		this.ui_set = false;
		this.ui = mat4.create();
		this.di = mat4.create();

		this.vertices = [];
		this.vertices.push(vec4.create());
		this.vertices.push(vec4.create());
		this.indices = [vec2.fromValues(0,1)];
		this.weights = [];

		// this.glmSetup();
	}


	// glmSetup(){
	// 	this.VAO = gl.createBuffer();
	// 	gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
	// 	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
	// 	gl.vertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 0, 0);
	// 	gl.enableVertexAttribArray(0);

	// 	this.EBO = gl.createBuffer();
	// 	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
	// 	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

	// 	// Probably not necessary
	// 	gl.bindBuffer(gl.ARRAY_BUFFER, 0);
	// 	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, 0);
	// }

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
		this.root = vec3.fromValues(x,y,z);

	}
}

function createSkeletonFromRawBones(rawbones){
	console.log("Creating skeleton");


	bones = [];
	for(i=0; i<rawbones.length -1; ++i){
		bones.push(new Bone(-2, -2, mat4.create(), mat4.create(), -2));
	}

	var cid;
	var pid;
	var dx;
	var dy;
	var dz;

	var length;
	var bone_vec;
	var ti = mat4.create();;
	var ri = mat4.create();

	var t_hat = vec3.create();
	var n_hat = vec3.create();
	var b_hat = vec3.create();

	var doot;
	var new_bone;

	for(i=0; i<rawbones.length; ++i){
		child = rawbones[i];
		cid = child.id;

		if(cid == -1){
			doot = new Skeleton(child.dx, child.dy, child.dz);
			continue;
		}

		bone_vec = vec3.fromValues(child.dx, child.dy, child.dz);
		length = vec3.length(bone_vec);

		parent = rawbones[child.parent];
		pid = parent.id;

		if(pid==-1){
			// Orphaned bone
			var trans_vec = vec3.fromValues(doot.root[0], doot.root[1], doot.root[2])
			mat4.translate(ti, mat4.create(), trans_vec);
		}
		else {
			// Regular-ass bone
			mat4.translate(ti, mat4.create(), vec3.fromValues(bones[pid].l, 0, 0));
		}

		// Find coord axes (in world coords)
		vec3.normalize(t_hat, bone_vec);
		n_hat = determineNHat(t_hat);
		vec3.cross(b_hat, t_hat, n_hat);

		var tbn = mat4.create();
		mat4[0]  = t_hat[0];
		mat4[1]  = t_hat[1];
		mat4[2]  = t_hat[2];
		mat4[3]  = 0;

		mat4[4]  = n_hat[0];
		mat4[5]  = n_hat[1];
		mat4[6]  = n_hat[2];
		mat4[7]  = 0;

		mat4[8]  = b_hat[0];
		mat4[9]  = b_hat[1];
		mat4[10] = b_hat[2];
		mat4[11] = 0;

		mat4[12] = 0;
		mat4[13] = 0;
		mat4[14] = 0;
		mat4[15] = 1;

	    // Find Ri from tbn
	    // R(0)...R(i-1)*R(i) = tbn
		var temp_pid = pid;
		while(temp_pid > -1){

			// Hold THIS bone's ri
			var temp_ri = mat4.clone(ri);

			// Hold parent's bone's ri
			var temp_p_ri = mat4.clone(bones[temp_pid].ri);

			// Hold inverted parent's bone's ri
			var temp_inv = mat4.create();
			mat4.invert(temp_inv, temp_p_ri);

			// Calculate this bone's ri
			ri = mat4.multiply(ri, temp_ri, temp_inv);
			temp_pid = bones[temp_pid].pid;
		}
	    // R(i) = R(i-1)T*...*R(0)T*tbn
		var temp_ri = mat4.clone(ri);
		ri = mat4.multiply(ri, temp_ri, tbn);

		// Create a bone, add to parent appropriately
		new_bone = new Bone(cid, length, ti, ri, pid);
		bones[cid] = new_bone;
		if(pid == -1) doot.children.push(new_bone);
		else bones[pid].children.push(new_bone);
	}

	doot.bone_vector = bones;
	return doot;

}

function determineNHat(t_hat){

	var nV = vec3.clone(t_hat);

	var min = Math.abs(t_hat[0]);
	if(min > Math.abs(t_hat[1])) min = Math.abs(t_hat[1]);
	if(min > Math.abs(t_hat[2])) min = Math.abs(t_hat[2]);

	nV[0] = (Math.abs(nV[0]) == min) ? 1 : 0;
	nV[1] = (Math.abs(nV[1]) == min) ? 1 : 0;
	nV[2] = (Math.abs(nV[2]) == min) ? 1 : 0;

	var t_hat_cross_v = vec3.create();
	vec3.cross(t_hat_cross_v, t_hat, nV);

	var n_hat = vec3.create();
	vec3.normalize(n_hat, t_hat_cross_v);

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

	for(i=0; i<lines.length-1; ++i){
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



























