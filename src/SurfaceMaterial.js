import * as THREE from 'three';
import vertexShader from './shaders/surfaceMaterial.vert';
import fragmentShader from './shaders/surfaceMaterial.frag';

// extends MeshPhysicalMaterial with triplanar mapping and parallax mapping

export default class extends THREE.ShaderMaterial {
  constructor(parameters) {
    super(parameters);
    this.lights = true;

    this.extensions.derivatives = true;

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
        envMapIntensity: { value: 1 }
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

    const materialProperties = ['aoMap', 'envMap' ,'map', 'metalness', 'metalnessMap', 'normalMap', 'normalScale', 'parallaxScale', 'roughness', 'roughnessMap', 'uvScale'];
    for (let p of materialProperties) {
      Object.defineProperty(this, p, {
        enumerable: true,
        get: () => this.uniforms[p].value,
        set: value => {
          this.uniforms[p].value = value;
        }
      });
    }
  }

  get color() {
    return this.uniforms.diffuse.value;
  }

  set color(value) {
    this.uniforms.diffuse.value.set(value);
  }

  get parallaxMap() {
    return this.uniforms.parallaxMap.value;
  }

  set parallaxMap(map) {
    this.uniforms.parallaxMap.value = map;
    this.defines.USE_PARALLAXMAP = map ? true : false;
  }
}