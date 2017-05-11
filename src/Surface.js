export default class {
  constructor() {
    this.geometry;
    this.uvScale = 1;
    this.lastUvScale = 1;
  }

  _newGeometry(vertexCount) {
    if (this.geometry) {
      this.geometry.dispose();
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    this.geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));

    const uvs = new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2);
    this.geometry.addAttribute('uv', uvs);
    this.geometry.addAttribute('uv2', uvs);
  }

  updateUvs() {
    const uv = this.geometry.getAttribute('uv');
    const uvArray = uv.array;

    for (let i = 0; i < uvArray.length; i++) {
      uvArray[i] = this.uvScale * uvArray[i] / this.lastUvScale;
    }

    this.lastUvScale = this.uvScale;

    uv.needsUpdate = true;

  }

  generate() {
    this.lastUvScale = this.uvScale;
  }

}