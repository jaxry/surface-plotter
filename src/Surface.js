export default class {
  constructor() {
    this.geometry;
    this.uvScale = 1;
  }

  _newGeometry(vertexCount = 0, indexCount = 0) {
    if (this.geometry) {
      this.geometry.dispose();
    }

    this.geometry = new THREE.BufferGeometry();

    this.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    this.geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    this.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indexCount), 1));
  }

  generate() {
    // override in child class
  }
}