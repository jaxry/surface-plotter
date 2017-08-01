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

    const uvs = new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2);
    this.geometry.addAttribute('uv', uvs);
    this.geometry.addAttribute('uv2', uvs);
  }

  updateUvs(uvScale) {
    const uv = this.geometry.getAttribute('uv');
    const uvArray = uv.array;

    for (let i = 0; i < uvArray.length; i++) {
      uvArray[i] *= uvScale / this.uvScale;
    }

    uv.needsUpdate = true;

    this.uvScale = uvScale;
  }

  generate() {
    // override in child class
  }
}