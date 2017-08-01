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
    super._newGeometry(65535, 65535);

    const positions = this.geometry.getAttribute('position');
    const normals = this.geometry.getAttribute('normal');

    const pushVertex = (position, normal) => {
      positions.setXYZ(this.vertexIndex, position.x, position.y, position.z);
      normals.setXYZ(this.vertexIndex, normal.x, normal.y, normal.z);

      return this.vertexIndex++;
    };

    const indices = this.geometry.getIndex().array;

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