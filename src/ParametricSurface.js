import * as THREE from 'three';

const eps = 0.00001;

export default class {
  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.lastDefinition = {};
  }

  _newGeometry(rows, columns) {
    const count = rows * columns;

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));

    const tileRows = rows - 1;
    const tileColumns = columns - 1;
    const indices = new Uint32Array(6 * tileRows * tileColumns);

    for (let i = 0; i < tileRows; i++) {
      for (let j = 0; j < tileColumns; j++) {
        const topL = columns * i + j;
        const topR = columns * i + j + 1;
        const botL = columns * (i + 1) + j;
        const botR = columns * (i + 1) + j + 1;
        const start = 6 * (tileColumns * i + j);
        if (i % 2 === j % 2) {
          indices[start] = botL;
          indices[start + 1] = botR;
          indices[start + 2] = topL;
          indices[start + 3] = topL;
          indices[start + 4] = botR;
          indices[start + 5] = topR;
        }
        else {
          indices[start] = topL;
          indices[start + 1] = botL;
          indices[start + 2] = topR;
          indices[start + 3] = botR;
          indices[start + 4] = topR;
          indices[start + 5] = botL;
        }
      }
    }

    this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  _computeSurface(definition) {
    const {fx, fy, fz, u0, u1, v0, v1, rows, columns} = definition;

    const positions =  this.geometry.getAttribute('position');
    const normals =  this.geometry.getAttribute('normal');
    const uvs = this.geometry.getAttribute('uv');

    const tempv = new THREE.Vector3();
    const f = new THREE.Vector3();
    const ru = new THREE.Vector3();
    const rv = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let i = 0; i < rows; i++) {

      const vd = i / (rows - 1);

      for (let j = 0; j < columns; j++) {
        const ud = j / (columns - 1);

        const u = u0 + ud * (u1 - u0);
        const v = v0 + vd * (v1 - v0);

        f.set(fx(u, v), fy(u, v), fz(u, v));

        let offset = u - eps;
        if (offset >= u0) {
          ru.subVectors(f, tempv.set(fx(offset, v), fy(offset, v), fz(offset, v)));
        }
        else {
          offset = u + eps;
          ru.subVectors(tempv.set(fx(offset, v), fy(offset, v), fz(offset, v)), f);
        }

        offset = v - eps;
        if (offset >= v0) {
          rv.subVectors(f, tempv.set(fx(u, offset), fy(u, offset), fz(u, offset)));
        }
        else {
          offset = v + eps;
          rv.subVectors(tempv.set(fx(u, offset), fy(u, offset), fz(u, offset)), f);
        }

        normal.crossVectors(rv, ru).normalize();

        const index = columns * i + j;
        positions.setXYZ(index, f.x, f.y, f.z);
        normals.setXYZ(index, normal.x, normal.y, normal.z);
        uvs.setXY(index, 2 * vd, 2 * ud);
      }
    }

    positions.needsUpdate = true;
    normals.needsUpdate = true;
    uvs.needsUpdate = true;
  }

  generate(definition) {
    if (this.lastDefinition.rows !== definition.rows || this.lastDefinition.columns !== definition.columns) {
      this._newGeometry(definition.rows, definition.columns);
    }

    this._computeSurface(definition);

    this.lastDefinition = definition;
  }
}
