import { request } from './util';

export default class {
  constructor(basePath) {
    this.basePath = basePath;

    this.names;

    this.init = request(`${basePath}index.json`, 'json')
      .then(index => {
        return this.names = new Set(index.names);
      })
      .catch(status => {
        console.warn(status, 'Could not load environments');
        return Promise.reject();
      });
  }

  _createDirectional(info) {
    const light = new THREE.DirectionalLight(info.color, info.intensity);
    light.position.setFromSpherical(new THREE.Spherical(10, info.lat * Math.PI, info.lon * Math.PI));
    light.updateMatrix();

    if (info.shadow === undefined || info.shadow) {
      light.castShadow = true;
      light.shadow.bias = -0.0003;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.matrixAutoUpdate = true;
    }

    return light;
  }

  _setupLights(lights) {

    const group = new THREE.Group();

    if (lights.hemisphere) {
      const info = lights.hemisphere;
      group.add(
        new THREE.HemisphereLight(info.sky, info.ground, info.intensity)
      );
    }

    if (lights.directional) {
      for (let info of lights.directional) {
        group.add(this._createDirectional(info));
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

    const lightsPromise = request(`${envPath}lights.json`, 'json')
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