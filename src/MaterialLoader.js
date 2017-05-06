import * as THREE from 'three';
import { request } from './util';

const textureProps = {
  albedo: 'map',
  ao: 'aoMap',
  bump: 'bumpMap',
  height: 'displacementMap',
  metalness: 'metalnessMap',
  normal: 'normalMap',
  roughness: 'roughnessMap'
};

const baseMaterialProps = {
  roughness: 0.5,
  metalness: 0,
  reflectivity: 0.5,
  displacementScale: 1,
};

for (let texture of Object.values(textureProps)) {
  baseMaterialProps[texture] = null;
}

export default class {
  constructor(basePath, anisotropy) {
    this.basePath = basePath;
    this.anisotropy = anisotropy;

    this.names;

    this.init = request(`${basePath}/index.json`, 'json')
      .then(index => {
        return this.names = new Set(index.names);
      })
      .catch(status => {
        console.warn(status, 'Could not load materials');
        return Promise.reject();
      });
  }

  _loadTexture(path) {
    return new Promise((resolve, reject) => {
      const t = new THREE.TextureLoader().load(path, resolve);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = this.anisotropy;
      t.flipY = false;
    });
  }

  load(name) {
    if (!this.names.has(name)) {
      return Promise.reject();
    }

    const matPath = `${this.basePath}/${name}`;
    const material = Object.assign({}, baseMaterialProps);

    return request(`${matPath}/material.json`, 'json')
      .then(definition => {

        Object.assign(material, definition.properties);

        const texturePromises = [];

        for (let name of definition.textures) {
          const promise = this._loadTexture(`${matPath}/${name}.jpg`);
          promise.then(texture => {
            material[textureProps[name]] = texture;
          });
          texturePromises.push(promise);
        }

        return Promise.all(texturePromises);
      })
      .then(() => {
        return material;
      });
  }
}