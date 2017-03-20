import computeNormals from './computeNormals';

function initArrayBuffer(gl, buffer, size, index) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(index, size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(index);
}

class Buffer {
  constructor(gl, type = gl.ARRAY_BUFFER) {
    this.gl = gl;
    this.type = type;
    this.buffer = gl.createBuffer();
    this.size = 0;
  }

  update(data) {
    this.gl.bindBuffer(this.type, this.buffer);

    if (data.length === this.size) {
      this.gl.bufferSubData(this.type, 0, data);
      return true;
    }

    this.gl.bufferData(this.type, data, this.gl.DYNAMIC_DRAW);
    this.size = data.length;
    return false;
  }
}

class SwappableBuffer {
  constructor(gl) {
    this.gl = gl;
    this.front = new Buffer(gl);
    this.back = new Buffer(gl);
  }

  swap() {
    const t = this.front;
    this.front = this.back;
    this.back = t;
  }

  update(data) {
    this.swap();
    const sameBuffer = this.front.update(data);
    if (!sameBuffer) {
      this.back.update(data);
    }

    return sameBuffer;
  }
}

export default class {
  constructor(gl) {
    this.gl = gl;

    this.buffers = {
      positions: new SwappableBuffer(gl),
      normals: new SwappableBuffer(gl),
      elements: new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER),
    };

    this.count = 0;

    this._vao = gl.createVertexArray();
  }

  update({positions, normals, elements}) {
    if (!normals) {
      normals = computeNormals(positions, elements);
    }

    this.buffers.positions.update(positions);
    this.buffers.normals.update(normals);

    this.gl.bindVertexArray(this._vao);
    initArrayBuffer(this.gl, this.buffers.positions.front.buffer, 3, 0);
    initArrayBuffer(this.gl, this.buffers.normals.front.buffer, 3, 1);
    initArrayBuffer(this.gl, this.buffers.positions.back.buffer, 3, 2);
    initArrayBuffer(this.gl, this.buffers.normals.back.buffer, 3, 3);

    this.buffers.elements.update(elements);
    this.count = elements.length;
  }

  render() {
    this.gl.bindVertexArray(this._vao);
    this.gl.drawElements(this.gl.TRIANGLES, this.count, this.gl.UNSIGNED_INT, 0);
  }
}