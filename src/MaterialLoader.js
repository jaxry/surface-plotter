import * as THREE from 'three';
import { request } from './util';

const textureProps = {
  albedo: 'map',
  ao: 'aoMap',
  height: 'parallaxMap',
  metalness: 'metalnessMap',
  normal: 'normalMap',
  roughness: 'roughnessMap'
};

export default class {
  constructor(basePath, anisotropy) {
    this.basePath = basePath;
    this.anisotropy = anisotropy;
    this.abortLoading = [];
  }

  _loadTexture(path) {
    let texture;

    const promise = new Promise((resolve, reject) => {
      texture = new THREE.TextureLoader().load(path, resolve, null, reject);
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = this.anisotropy;
    texture.flipY = true;

    return {
      texture,
      promise,
      abort: () => {
        if (!texture.image.complete) {
          texture.image.src = ''; // cancels the previous request
        }
      }
    };
  }

  load(name) {
    for (let abort of this.abortLoading) {
      abort();
    }

    const matPath = `${this.basePath}/${name}`;
    const material = {};

    for (let texture of Object.values(textureProps)) {
      material[texture] = null;
    }

    const materialRequest = request(`${matPath}/material.json`);

    this.abortLoading = [materialRequest.abort];

    return materialRequest.promise
      .then(definition => {
        this.abortLoading = [];

        material.roughness = definition.roughness || 0.5;
        material.metalness = definition.metalness || 0;

        const texturePromises = [];

        if (definition.pbr && definition.pbr.length) {
          const loading = this._loadTexture(`${matPath}/pbr.jpg`);

          for (let name of definition.pbr) {
            if (!textureProps[name]) {
              continue;
            }
            material[textureProps[name]] = loading.texture;
          }

          texturePromises.push(loading.promise);
          this.abortLoading.push(loading.abort);
        }

        for (let name of definition.textures) {
          if (!textureProps[name]) {
            continue;
          }

          const loading = this._loadTexture(`${matPath}/${name}.jpg`);

          material[textureProps[name]] = loading.texture;

          texturePromises.push(loading.promise);
          this.abortLoading.push(loading.abort);
        }

        return Promise.all(texturePromises);
      })
      .then(() => {
        this.abortLoading = []; // finished downloading all images
        return material;
      });
  }
}