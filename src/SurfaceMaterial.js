import * as THREE from 'three';
import vertexShader from './shaders/surfaceMaterial.vert';
import fragmentShader from './shaders/surfaceMaterial.frag';

export default class extends THREE.MeshPhysicalMaterial {
  constructor(parameters) {
    super(parameters);

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.physical.uniforms);
    this.type = 'CustomSurfaceMaterial';
  }
}