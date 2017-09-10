import * as THREE from 'three';
import Surface from './Surface';

const EPS = 0.00001;

export default class extends Surface {
  constructor() {
    super();
    this.morphPositions;
    this.morphNormals;
    this._lastResolution;
  }

  _newGeometry(resolution) {
    const tileResolution = resolution - 1;

    super._newGeometry(resolution * resolution, 6 * tileResolution * tileResolution);

    const indices = this.geometry.getIndex().array;

    for (let i = 0; i < tileResolution; i++) {
      for (let j = 0; j < tileResolution; j++) {
        const topL = resolution * i + j;
        const topR = resolution * i + j + 1;
        const botL = resolution * (i + 1) + j;
        const botR = resolution * (i + 1) + j + 1;
        const start = 6 * (tileResolution * i + j);
        if (i % 2 === j % 2) {
          indices[start] = topL;
          indices[start + 1] = botR;
          indices[start + 2] = botL;
          indices[start + 3] = topL;
          indices[start + 4] = topR;
          indices[start + 5] = botR;
        }
        else {
          indices[start] = topL;
          indices[start + 1] = topR;
          indices[start + 2] = botL;
          indices[start + 3] = topR;
          indices[start + 4] = botR;
          indices[start + 5] = botL;
        }
      }
    }
  }

  _computeSurface(definition, resolution) {
    const {fx, fy, fz, u0, u1, v0, v1} = definition;

    const positions =  this.geometry.getAttribute('position');
    const normals =  this.geometry.getAttribute('normal');

    const center = new THREE.Vector3();
    const tempv = new THREE.Vector3();
    const f = new THREE.Vector3();
    const ru = new THREE.Vector3();
    const rv = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let i = 0; i < resolution; i++) {

      const vd = i / (resolution - 1);

      for (let j = 0; j < resolution; j++) {
        const ud = j / (resolution - 1);

        const u = u0 + ud * (u1 - u0);
        const v = v0 + vd * (v1 - v0);

        f.set(fx(u, v), fy(u, v), fz(u, v));

        // approximate tangent vectors via finite differences
        let offset = u - EPS;
        if (offset >= u0) {
          ru.subVectors(f, tempv.set(fx(offset, v), fy(offset, v), fz(offset, v)));
        }
        else {
          offset = u + EPS;
          ru.subVectors(tempv.set(fx(offset, v), fy(offset, v), fz(offset, v)), f);
        }

        offset = v - EPS;
        if (offset >= v0) {
          rv.subVectors(f, tempv.set(fx(u, offset), fy(u, offset), fz(u, offset)));
        }
        else {
          offset = v + EPS;
          rv.subVectors(tempv.set(fx(u, offset), fy(u, offset), fz(u, offset)), f);
        }

        // cross product of tangent vectors gives surface normal
        normal.crossVectors(ru, rv).normalize();

        const index = resolution * i + j;
        positions.setXYZ(index, f.x, f.y, f.z);
        normals.setXYZ(index, normal.x, normal.y, normal.z);

        center.add(f);
      }
    }

    positions.needsUpdate = true;
    normals.needsUpdate = true;

    center.divideScalar(resolution * resolution);

    return center;
  }

  generate(definition, resolution) {
    super.generate();

    let animatable;
    let center;

    if (this._lastResolution !== resolution) {
      this._newGeometry(resolution);

      this.morphPositions = this.geometry.getAttribute('position').clone();
      this.morphNormals = this.geometry.getAttribute('normal').clone();

      center = this._computeSurface(definition, resolution);

      animatable = false;
    }
    else {
      const positions = this.geometry.getAttribute('position');
      const normals = this.geometry.getAttribute('normal');

      this.geometry.addAttribute('position', this.morphPositions);
      this.geometry.addAttribute('normal', this.morphNormals);

      this.morphPositions = positions;
      this.morphNormals = normals;

      this.geometry.morphAttributes.position = [this.morphPositions];
      this.geometry.morphAttributes.normal = [this.morphNormals];

      center = this._computeSurface(definition, resolution);

      animatable = true;
    }

    this._lastResolution = resolution;

    return {
      center,
      animatable
    };
  }
}
