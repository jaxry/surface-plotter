import * as THREE from 'three';
import { request } from './util';

const mapNames = {
  albedo: 'map',
  height: 'parallaxMap',
  normal: 'normalMap',
};

const pbrNames = {
  ao: 'aoMap',
  roughness: 'roughnessMap',
  metalness: 'metalnessMap',
};

function objPropWithDefault(object, property, defaultValue) {
  return object[property] === undefined ? defaultValue : object[property];
}

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

    for (let texture of Object.values(mapNames)) {
      material[texture] = null;
    }

    const materialRequest = request(`${matPath}/material.json`);

    this.abortLoading = [materialRequest.abort];

    return materialRequest.promise
      .then(definition => {
        this.abortLoading = [];

        material.roughness = objPropWithDefault(definition, 'roughness', 0);
        material.metalness = objPropWithDefault(definition, 'metalness', 0);
        material.parallaxScale = 0.03 * objPropWithDefault(definition, 'height', 1);
        material.reflectivity = objPropWithDefault(definition, 'reflectivity', 0.5);

        const texturePromises = [];
        let pbrTexture;

        for (let name of definition.map) {
          let loading;

          if (pbrNames[name]) {

            if (!pbrTexture) {
              pbrTexture = this._loadTexture(`${matPath}/pbr.jpg`);
            }

            if (name === 'roughness') {
              material.roughness = 1;
            }
            if (name === 'metalness') {
              material.metalness = 1;
            }

            loading = pbrTexture;
            material[pbrNames[name]] = loading.texture;
          }
          else if (mapNames[name]) {
            loading = this._loadTexture(`${matPath}/${name}.jpg`);
            material[mapNames[name]] = loading.texture;
          }
          else {
            continue;
          }

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