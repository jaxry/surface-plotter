import * as THREE from 'three';
import CubeTextureLoader from './CubeTextureLoader';
import { request } from './util';

export default class {
  constructor(basePath) {
    this.basePath = basePath;
    this.abortLoading = [];
  }

  _setupLights(definition) {
    const group = new THREE.Group();

    if (definition.hemisphere) {
      const info = definition.hemisphere;
      group.add(new THREE.HemisphereLight(info.sky, info.ground, 3 * info.intensity || 3));
    }

    if (definition.directional) {
      const distance = 1;
      const nearPlane = 1;

      for (let info of definition.directional) {
        const light = new THREE.DirectionalLight(info.color, 3 * info.intensity || 3);
        light.position.setFromSpherical(new THREE.Spherical(distance + nearPlane, info.lat * Math.PI, info.lon * Math.PI));
        light.updateMatrix();
        if (info.shadow === undefined || info.shadow) {
          light.castShadow = true;
          light.shadow.bias = -0.025;
          light.shadow.mapSize.set(1024, 1024);
          light.shadow.camera.left = -distance;
          light.shadow.camera.right = distance;
          light.shadow.camera.bottom = -distance;
          light.shadow.camera.top = distance;
          light.shadow.camera.near = nearPlane;
          light.shadow.camera.far = 2 * distance + nearPlane;
          light.shadow.camera.matrixAutoUpdate = true;
        }

        group.add(light);
      }
    }

    return group;
  }

  get default() {
    return {
      lights: this._setupLights({
        hemisphere: {
          sky: 0xffffff,
          ground: 0x333333
        }
      }),
      cubemap: null
    }
  }

  load(name) {
    for (let abort of this.abortLoading) {
      abort();
    }

    const envPath = `${this.basePath}/${name}/`;

    let cubemap;

    const cubemapPromise = new Promise((resolve, reject) => {
      cubemap = new CubeTextureLoader()
        .setPath(envPath)
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'], resolve, null, reject);
    });

    const abortCubemap = () => {
      for (let image of cubemap.images) {
        if (!image.complete) {
          image.src = ''; // cancels the previous request
        }
      }
    };

    const lightsRequest = request(`${envPath}/lights.json`);

    this.abortLoading = [abortCubemap, lightsRequest.abort];

    return Promise.all([cubemapPromise, lightsRequest.promise])
      .then(([cubemap, lightsDefinition]) => {
        this.abortLoading = [];
        return {
          lights: this._setupLights(lightsDefinition),
          cubemap
        };
      });
  }
}