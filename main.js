let gl;
let program;
let rotation = 0;
let isPaused = false;
let position = [0.0, 0.0, -3.0];
let velocity = [0.01, 0.01, 0.0];

// Initialize WebGL context
function initGL() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL');
        return;
    }

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
            color: gl.getAttribLocation(program, 'aVertexColor')
        }
    };
}

// Initialize vertex buffers
function initBuffers() {
    // Create cube vertices
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        // Back face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
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

        // Use program and set uniforms
        gl.useProgram(program);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjectionMatrix'), false, projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelViewMatrix'), false, modelViewMatrix);

        // Bind the vertex buffer and set the attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, glSetup.buffers.position);
        gl.vertexAttribPointer(glSetup.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(glSetup.attribLocations.position);

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
        if (position[0] > 2.0 || position[0] < -2.0) {
            velocity[0] = -velocity[0];
        }
        if (position[1] > 2.0 || position[1] < -2.0) {
            velocity[1] = -velocity[1];
        }
    }
    requestAnimationFrame(render);
}

// Matrix manipulation library
const mat4 = {
    create: function() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },
    perspective: function(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) / (near - far);
        out[15] = 0;
        return out;
    },
    translate: function(out, a, v) {
        out[12] = a[0] * v[0] + a[4] * v[1] + a[8] * v[2] + a[12];
        out[13] = a[1] * v[0] + a[5] * v[1] + a[9] * v[2] + a[13];
        out[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14];
        out[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15];
        return out;
    },
    rotate: function(out, a, rad, axis) {
        let x = axis[0], y = axis[1], z = axis[2];
        let len = Math.sqrt(x * x + y * y + z * z);
        
        if (len < 0.000001) { return null; }
        
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const t = 1 - c;
        
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        const b00 = x * x * t + c;
        const b01 = y * x * t + z * s;
        const b02 = z * x * t - y * s;
        const b10 = x * y * t - z * s;
        const b11 = y * y * t + c;
        const b12 = z * y * t + x * s;
        const b20 = x * z * t + y * s;
        const b21 = y * z * t - x * s;
        const b22 = z * z * t + c;
        
        out[0] = a00 * b00 + a10 * b01 + a20 * b02;
        out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        out[2] = a02 * b00 + a12 * b01 + a22 * b02;
        out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        out[4] = a00 * b10 + a10 * b11 + a20 * b12;
        out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        out[6] = a02 * b10 + a12 * b11 + a22 * b12;
        out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        out[8] = a00 * b20 + a10 * b21 + a20 * b22;
        out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        out[10] = a02 * b20 + a12 * b21 + a22 * b22;
        out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        
        if (a !== out) {
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }
        return out;
    }
};

// Add event listener to toggle pause state
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        isPaused = !isPaused;
    }
});

// Start the rendering
const glSetup = initGL();
if (glSetup) {
    program = glSetup.program;
    render();
}