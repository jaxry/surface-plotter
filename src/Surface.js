import * as THREE from 'three';

export default class {
  constructor() {
    this.geometry;
  }

  _newGeometry(vertexCount = 0, indexCount = 0) {
    this.dispose();

    this.geometry = new THREE.BufferGeometry();

    const position = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3);
    position.dynamic = true;
    this.geometry.addAttribute('position', position);

    const normal = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3);
    normal.dynamic = true;
    this.geometry.addAttribute('normal', normal);

    this.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indexCount), 1));
  }

  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
  }

  generate() {
    // override in child class
  }
}
