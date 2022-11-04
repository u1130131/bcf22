// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// transformation matrices:
	var rotatX = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -1 * Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];
	var rotatY = [
		Math.cos(rotationY), 0, -1 * Math.sin(rotationY), 0,
		0, 1, 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];
	
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	
	// combine:
	var a = MatrixMult( rotatY, rotatX );
	var b = MatrixMult( trans, a );
	var mvp = MatrixMult( projectionMatrix, b );
	return mvp;
}

// Vertex shader source code
var meshVS = `
	attribute vec3 pos;
	attribute vec2 txc;
	uniform mat4 mvp;
	varying vec2 texCoord;
	void main()
	{
		gl_Position = mvp * vec4(pos,1);
		texCoord = txc;
	}
`;
// Fragment shader source code
var meshFS = `
	precision mediump float;
	uniform sampler2D tex;
	uniform bool display;
	varying vec2 texCoord;
	void main()
	{
		gl_FragColor = display ? texture2D(tex, texCoord) : vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
	}
`;

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// WebGL initializations:
		this.prog = InitShaderProgram( meshVS, meshFS );
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		this.texCoords = gl.getAttribLocation( this.prog, 'txc' );
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.sampler = gl.getUniformLocation( this.prog, 'tex' );
		this.toggler = gl.getUniformLocation( this.prog, 'display' );
		
		// buffers:
		this.vertbuffer = gl.createBuffer();
		this.texcbuffer = gl.createBuffer();

		// Note: 'Show Texture' is on by default.
		gl.useProgram( this.prog );
		gl.uniform1i( this.toggler, true );
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// store copy and update vertex buffer objects:
		this.pos = vertPos;
		this.numTriangles = vertPos.length / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		// update texture coordinate buffer object:
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texcbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		for ( var i=0; i < this.numTriangles; ++i) {
			var temp = this.pos[3*i+2];
			this.pos[3*i+2] = this.pos[3*i+1];
			this.pos[3*i+1] = temp;
		}
		// update vertex buffer objects:
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.pos), gl.STATIC_DRAW);
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// draw triangle mesh:
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, trans );
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texcbuffer );
		gl.vertexAttribPointer( this.texCoords, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texCoords );
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// bind texture:
		const mytex = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, mytex )

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// set uniform parameter(s) of the fragment shader:
		gl.generateMipmap( gl.TEXTURE_2D );
		
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, mytex );
		gl.useProgram( this.prog );
		gl.uniform1i( this.sampler, 0 );
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		gl.useProgram( this.prog );
		gl.uniform1i( this.toggler, show );
	}
}
