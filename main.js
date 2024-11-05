let gl;
let program;
let rotation = 0;
let isPaused = false;
let position = [0.0, 0.0, -3.0];
let velocity = [0.01, 0.01, 0.0];
let glSetup; // Define glSetup at the top level

async function loadShaderFile(url) {
    const response = await fetch(url);
    return await response.text();
}

async function initGL() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL');
        return;
    }

    // Load shader source code from files
    const vsSource = await loadShaderFile('cube.vert');
    const fsSource = await loadShaderFile('cube.frag');

    // Create shader program
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return;
    }

    // Initialize buffers
    const buffers = initBuffers();

    // Set clear color and enable depth testing
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Setup viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    return {
        program: program,
        buffers: buffers,
        attribLocations: {
            position: gl.getAttribLocation(program, 'aVertexPosition'),
            color: gl.getAttribLocation(program, 'aVertexColor'),
            normal: gl.getAttribLocation(program, 'aVertexNormal')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(program, 'uNormalMatrix')
        }
    };
}

// Initialize vertex buffers
function initBuffers() {
    // Create cube vertices
    const positions = [
        // Front face
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,
        // Back face
        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5,  0.5, -0.5,
        -0.5,  0.5, -0.5,
        // Top face
        -0.5,  0.5, -0.5,
        -0.5,  0.5,  0.5,
         0.5,  0.5,  0.5,
         0.5,  0.5, -0.5,
        // Bottom face
        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5, -0.5,  0.5,
        -0.5, -0.5,  0.5,
        // Right face
         0.5, -0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5,  0.5,  0.5,
         0.5, -0.5,  0.5,
        // Left face
        -0.5, -0.5, -0.5,
        -0.5, -0.5,  0.5,
        -0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,
    ];

    const normals = [
        // Front face
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
        // Back face
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
        // Top face
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
        // Bottom face
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
        // Right face
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
    ];

    const colors = [
        [1.0,  1.0,  1.0,  1.0],    // Front face: white
        [1.0,  0.0,  0.0,  1.0],    // Back face: red
        [0.0,  1.0,  0.0,  1.0],    // Top face: green
        [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
        [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
        [1.0,  0.0,  1.0,  1.0],    // Left face: purple
    ];

    var generatedColors = [];

    for (j = 0; j < 6; j++) {
        const c = colors[j];

        // Repeat each color four times for the four vertices of the face
        for (var i = 0; i < 4; i++) {
            generatedColors = generatedColors.concat(c);
        }
    }

    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create and bind normal buffer
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // Create and bind color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);

    // Create and bind index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: vertexBuffer,
        normal: normalBuffer,
        color: colorBuffer,
        indices: indexBuffer
    };
}

function loadShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Shader compilation error: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function render() {
    if (!isPaused) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, position);
        mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [1, 1, 0]);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        // Use program and set uniforms
        gl.useProgram(program);
        gl.uniformMatrix4fv(glSetup.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(glSetup.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(glSetup.uniformLocations.normalMatrix, false, normalMatrix);

        // Bind the vertex buffer and set the attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, glSetup.buffers.position);
        gl.vertexAttribPointer(glSetup.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(glSetup.attribLocations.position);

        // Bind the normal buffer and set the attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, glSetup.buffers.normal);
        gl.vertexAttribPointer(glSetup.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(glSetup.attribLocations.normal);

        // Bind the color buffer and set the attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, glSetup.buffers.color);
        gl.vertexAttribPointer(glSetup.attribLocations.color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(glSetup.attribLocations.color);

        // Bind the index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glSetup.buffers.indices);

        // Draw
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

        rotation += 0.01;

        // Update position based on velocity
        position[0] += velocity[0];
        position[1] += velocity[1];

        // Check for collisions with canvas boundaries and bounce
        const canvasWidth = gl.canvas.width / gl.canvas.height;
        const canvasHeight = 1.0;

        if (position[0] > canvasWidth - 0.5 || position[0] < -canvasWidth + 0.5) {
            velocity[0] = -velocity[0];
        }
        if (position[1] > canvasHeight - 0.5 || position[1] < -canvasHeight + 0.5) {
            velocity[1] = -velocity[1];
        }
    }
    requestAnimationFrame(render);
}

// Add event listener to toggle pause state
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        isPaused = !isPaused;
    }
});

// Start the rendering
initGL().then(setup => {
    if (setup) {
        glSetup = setup; // Assign the setup to the global variable
        program = glSetup.program;
        render();
    }
});