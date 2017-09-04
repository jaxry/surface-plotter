import * as THREE from 'three';
import vertexShader from './shaders/surfaceMaterial.vert';
import fragmentShader from './shaders/surfaceMaterial.frag';

const uniformNames = {
  color: 'diffuse'
};

export default class extends THREE.ShaderMaterial {
  constructor(parameters) {
    super(parameters);
    this.lights = true;

    this.extensions.derivatives = true;
    // this.extensions.shaderTextureLOD = true;
    this.defines.USE_PARALLAXMAP = false;

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;

    const ul = THREE.UniformsLib;

    this.uniforms = THREE.UniformsUtils.merge([
      ul.common,
      ul.envmap,
      ul.aomap,
      // ul.lightmap,
      // ul.emissivemap,
      // ul.bumpmap,
      ul.normalmap,
      // ul.displacementmap,
      ul.roughnessmap,
      ul.metalnessmap,
      // ul.fog,
      ul.lights,
      {
        emissive: { value: new THREE.Color( 0x000000 ) },
        roughness: { value: 0.5 },
        metalness: { value: 0.5 },
        envMapIntensity: { value: 1 } // temporary
      },
      {
        clearCoat: {value: 0},
        clearCoatRoughness: {value: 0}
      },
      {
        uvScale: {value: 1},
        parallaxMap: { value: null },
        parallaxScale: { value: 0.04 }
      }
    ]);
  }

  setBuiltinUniform(prop, value) {
    this[prop] = value;

    const name = uniformNames[prop] || prop;
    const uniform = this.uniforms[name];

    if (uniform.value instanceof THREE.Color) {
      uniform.value.set(value);
    }
    else {
      uniform.value = value;
    }
  }
}