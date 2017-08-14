import * as THREE from 'three';
import { request } from './util';

export default class {
  constructor(basePath) {
    this.basePath = basePath;

    this.names;

    this.init = request(`${basePath}/index.json`, 'json')
      .then(index => {
        return this.names = new Set(index.names);
      })
      .catch(status => {
        console.warn(status, 'Could not load environments');
        return Promise.reject();
      });
  }

  _setupLights(lights) {
    const group = new THREE.Group();

    if (lights.hemisphere) {
      const info = lights.hemisphere;
      group.add(new THREE.HemisphereLight(info.sky, info.ground, info.intensity || 4));
    }

    if (lights.directional) {
      const distance = 1;
      const nearPlane = 1;

      for (let info of lights.directional) {
        const light = new THREE.DirectionalLight(info.color, info.intensity || 2.5);
        light.position.setFromSpherical(new THREE.Spherical(distance + nearPlane, info.lat * Math.PI, info.lon * Math.PI));
        light.updateMatrix();
        if (info.shadow === undefined || info.shadow) {
          light.castShadow = true;
          light.shadow.bias = -0.03;
          light.shadow.mapSize.set(1024, 1024);
          light.shadow.camera.left = -distance;
          light.shadow.camera.right = distance;
          light.shadow.camera.bottom = -distance;
          light.shadow.camera.top = distance;
          light.shadow.camera.near = nearPlane;
          light.shadow.camera.far = 2 * distance + nearPlane;
          light.shadow.camera.matrixAutoUpdate = true;

          // group.add(new THREE.CameraHelper(light.shadow.camera));
          // group.add(new THREE.DirectionalLightHelper(light));
        }

        group.add(light);
      }
    }

    return group;
  }

  load(name) {
    if (!this.names.has(name)) {
      return Promise.reject();
    }

    const envPath = `${this.basePath}/${name}/`;

    const cubemapPromise = new Promise(resolve => {
      new THREE.CubeTextureLoader()
        .setPath(envPath)
        .load([
          'px.jpg', 'nx.jpg',
          'py.jpg', 'ny.jpg',
          'pz.jpg', 'nz.jpg'
        ], resolve);
    });

    const lightsPromise = request(`${envPath}/lights.json`, 'json')
      .then(lights => this._setupLights(lights));

    return Promise.all([cubemapPromise, lightsPromise])
      .then(([cubemap, lights]) => {
        return {
          cubemap,
          lights
        };
      });
  }
}