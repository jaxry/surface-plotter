import * as THREE from 'three';
import Surface from './Surface';
import Polygonizer from './Polygonizer.js';

export default class extends Surface {
  constructor() {
    super();
    this.vertexIndex = 0;
    this.triangleIndex = 0;
  }

  _newGeometry() {
    super._newGeometry(65535);
    const indices = new Uint32Array(65535);
    this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  generate(definition) {
    this._newGeometry();




    const positions = this.geometry.getAttribute('position').array;
    const normals = this.geometry.getAttribute('normal').array;
    const indices = this.geometry.getIndex().array;

    let vertexIndex = 0;

    const pushVertex = (position, normal) => {
      const aIndex = vertexIndex * 3;

      positions[aIndex + 0] = position.x;
      positions[aIndex + 1] = position.y;
      positions[aIndex + 2] = position.z;
      normals[aIndex + 0] = normal.x;
      normals[aIndex + 1] = normal.y;
      normals[aIndex + 2] = normal.z;

      return vertexIndex++;
    };

    let triangleIndex = 0;

    const pushTriangle = (v1, v2, v3) => {
      indices[triangleIndex++] = v1;
      indices[triangleIndex++] = v2;
      indices[triangleIndex++] = v3;
    };


    const polygonizer = new Polygonizer(pushVertex, pushTriangle);

    console.time('polygonize');
    polygonizer.triangulate(definition.equation);
    // this.geometry.computeVertexNormals();
    console.timeEnd('polygonize');
  }
}