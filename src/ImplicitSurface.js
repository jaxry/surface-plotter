import * as THREE from 'three';
import Surface from './Surface';
import Polygonizer from './Polygonizer';

export default class extends Surface {
  constructor() {
    super();
    this.vertexIndex = 0;
    this.triangleIndex = 0;
    this._newGeometry();
  }

  _newGeometry() {
    super._newGeometry(65535);
    const indices = new Uint32Array(65535);
    this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const positions = this.geometry.getAttribute('position').array;
    const normals = this.geometry.getAttribute('normal').array;

    const pushVertex = (position, normal) => {
      const aIndex = this.vertexIndex * 3;

      positions[aIndex + 0] = position.x;
      positions[aIndex + 1] = position.y;
      positions[aIndex + 2] = position.z;
      normals[aIndex + 0] = normal.x;
      normals[aIndex + 1] = normal.y;
      normals[aIndex + 2] = normal.z;

      return this.vertexIndex++;
    };

    const pushTriangle = (v1, v2, v3) => {
      indices[this.triangleIndex++] = v1;
      indices[this.triangleIndex++] = v2;
      indices[this.triangleIndex++] = v3;
    };

    this.polygonizer = new Polygonizer(pushVertex, pushTriangle);
  }

  generate(definition, center, radius) {
    super.generate();

    this.vertexIndex = 0;
    this.triangleIndex = 0;
    this.polygonizer.center = center;
    this.polygonizer.radius = radius / 2;
    this.polygonizer.triangulate(definition.equation);

    this.geometry.getAttribute('position').needsUpdate = true;
    this.geometry.getAttribute('normal').needsUpdate = true;
    this.geometry.getIndex().needsUpdate = true;
    this.geometry.setDrawRange(0, this.triangleIndex);
  }
}