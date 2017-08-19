import * as THREE from 'three';
import { request } from './util';

const textureProps = {
  albedo: 'map',
  ao: 'aoMap',
  // height: 'displacementMap',
  metalness: 'metalnessMap',
  normal: 'normalMap',
  roughness: 'roughnessMap'
};

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
    return new Promise(resolve => {
      const t = new THREE.TextureLoader().load(path, resolve);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = this.anisotropy;
      t.flipY = true;
    });
  }

  load(name) {
    if (!this.names.has(name)) {
      return Promise.reject();
    }

    const matPath = `${this.basePath}/${name}`;
    const material = {};

    for (let texture of Object.values(textureProps)) {
      material[texture] = null;
    }

    return request(`${matPath}/material.json`, 'json')
      .then(definition => {

        material.roughness = definition.roughness || 0.5;
        material.metalness = definition.metalness || 0;

        const texturePromises = [];

        if (definition.pbr && definition.pbr.length) {
          const promise = this._loadTexture(`${matPath}/pbr.jpg`);

          promise.then(texture => {
            for (let name of definition.pbr) {
              if (!textureProps[name]) {
                continue;
              }
              material[textureProps[name]] = texture;
            }
          });

          texturePromises.push(promise);
        }

        for (let name of definition.textures) {
          if (!textureProps[name]) {
            continue;
          }

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