import computeNormals from './computeNormals';
import squareTiling from './squareTiling';

export default class {
  constructor(gl) {
    this.gl = gl;

    this.buffers = {
      positions: gl.createBuffer(),
      normals: gl.createBuffer(),
      elements: gl.createBuffer()
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normals);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);
  }

  generate({fx, fy, fz, u: [u0, u1], v: [v0, v1], rows, columns, uClosed, vClosed}) {
    const {uv, elements} = squareTiling(rows, columns, uClosed, vClosed, false);

    const positions = new Float32Array(uv.length / 2 * 3);
    this.positions = positions;
    this.elements = elements;

    for (let i = 0; i < uv.length; i += 2) {
      const u = u0 + uv[i+0] * (u1 - u0);
      const v = v0 + uv[i+1] * (v1 - v0);
      const j = Math.floor(i / 2) * 3;
      positions[j+0] = fx(u, v);
      positions[j+1] = fy(u, v);
      positions[j+2] = fz(u, v);
    }

    const normals = computeNormals(positions, elements);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.positions);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normals);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, elements, this.gl.STATIC_DRAW);
  }

  render(elapsed) {
    // const count = (3 * Math.floor(elapsed / 1)) % this.elements.length;
    this.gl.drawElements(this.gl.TRIANGLES, this.elements.length, this.gl.UNSIGNED_INT, 0);
  }
}