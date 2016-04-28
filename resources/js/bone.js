

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
		this.l = l;
		this.ti = ti;
		this.ri = ri;
		this.pid = pid;

		this.children = [];
		this.ui_set = false;

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
	}
}