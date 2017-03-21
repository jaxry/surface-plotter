import computeNormals from './computeNormals';

class Buffer {
  constructor(gl, type = gl.ARRAY_BUFFER, usage = gl.DYNAMIC_DRAW) {
    this.gl = gl;
    this.type = type;
    this.usage = usage;
    this.buffer = gl.createBuffer();
    this.size = 0;
  }

  resize(size) {
    const newBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, newBuffer);
    this.gl.bufferData(this.gl.COPY_WRITE_BUFFER, size, this.usage);

    const copySize = Math.min(this.size, size);

    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, this.buffer);
    this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, 0, 0, copySize);

    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, null);
    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, null);

    this.buffer = newBuffer;
  }

  update(data) {
    this.gl.bindBuffer(this.type, this.buffer);

    if (data.length === this.size) {
      this.gl.bufferSubData(this.type, 0, data);
    }

    this.gl.bufferData(this.type, data, this.usage);
    this.size = data.byteLength;
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
    this.front.update(data);
    if (this.front.size !== this.back.size) {
      this.back.update(data);
    }
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

    this._numElements = 0;
    this._vao = gl.createVertexArray();
  }

  _initArrayBuffer(buffer, size, index) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.vertexAttribPointer(index, size, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(index);
  }

  update({positions, normals, elements}) {
    if (!normals) {
      normals = computeNormals(positions, elements);
    }

    this.buffers.positions.update(positions);
    this.buffers.normals.update(normals);

    this.gl.bindVertexArray(this._vao);
    this._initArrayBuffer(this.buffers.positions.front.buffer, 3, 0);
    this._initArrayBuffer(this.buffers.normals.front.buffer, 3, 1);
    this._initArrayBuffer(this.buffers.positions.back.buffer, 3, 2);
    this._initArrayBuffer(this.buffers.normals.back.buffer, 3, 3);

    this.buffers.elements.update(elements);

    this._numElements = elements.length;
  }

  render() {
    this.gl.bindVertexArray(this._vao);
    this.gl.drawElements(this.gl.TRIANGLES, this._numElements, this.gl.UNSIGNED_INT, 0);
  }
}