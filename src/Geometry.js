import computeNormals from './computeNormals';

function createBuffers(gl, ...names) {
  const buffers = {};
  for (let name of names) {
    buffers[name] = gl.createBuffer();
  }
  return buffers;
}

function initArrayBuffer(gl, buffer, size, index) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(index, size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(index);
}

export default class {
  constructor(gl) {
    this.gl = gl;

    this.buffers = createBuffers(gl, 'positions', 'normals', 'elements');
    this.vao = gl.createVertexArray();

    gl.bindVertexArray(this.vao);
    initArrayBuffer(gl, this.buffers.positions, 3, 0);
    initArrayBuffer(gl, this.buffers.normals, 3, 1);
  }

  update({positions, normals, elements}) {

    this.positions = positions;
    this.elements = elements;

    if (!normals) {
      normals = computeNormals(positions, elements);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.positions);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normals);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.DYNAMIC_DRAW);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, elements, this.gl.DYNAMIC_DRAW);
  }

  render() {
    // const count = (3 * Math.floor(elapsed / 1)) % this.elements.length;
    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(this.gl.TRIANGLES, this.elements.length, this.gl.UNSIGNED_INT, 0);
  }
}