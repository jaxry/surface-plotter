import * as THREE from 'three';

export default class extends THREE.MeshPhysicalMaterial {
  constructor(parameters) {
    super(parameters);

    const shader = THREE.ShaderLib.physical;

    this.vertexShader = shader.vertexShader;
    this.fragmentShader = shader.fragmentShader;
    this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    this.type = 'CustomSurfaceMaterial';
  }
}