import * as THREE from 'three';
import Tweens from './Tweens';
import ParametricSurface from './ParametricSurface';
import ImplicitSurface from './ImplicitSurface';
import ImplicitSurfaceAnimator from './ImplicitSurfaceAnimator';
import SurfaceMaterial from './SurfaceMaterial';
import OrbitControls from './OrbitControls';
import EnvironmentLoader from './EnvironmentLoader';
import MaterialLoader from './MaterialLoader';
import Tabs from './components/Tabs';
import ParametricControls from './components/ParametricControls';
import ImplicitControls from './components/ImplicitControls';
import GraphicsControls from './components/GraphicsControls';
import { createElem, buildDomTree, throttleAnimationFrame, debounce, request } from './util';

const canvas = document.getElementById('plot');

THREE.Object3D.DefaultMatrixAutoUpdate = false;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setFaceCulling(THREE.CullFaceNone);
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.renderReverseSided = false;
renderer.shadowMap.renderSingleSided = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.25, 100);
const render = throttleAnimationFrame(() => {
  renderer.render(scene, camera);
}).function;

function resize() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  render();
}

const material = new SurfaceMaterial({
  side: THREE.DoubleSide
});
material.roughness = 0.75;
material.metalness = 0;
material.color = 0xffffff;
material.normalScale = new THREE.Vector2(1, -1);

const mesh = new THREE.Mesh();
mesh.material = material;
mesh.frustumCulled = false;
mesh.castShadow = true;
mesh.receiveShadow = true;

const orbitControls = new OrbitControls(camera, mesh, canvas);
orbitControls.onUpdate = render;

class ParametricGeometry {
  constructor() {
    this._surface = new ParametricSurface();
    this._tweens = new Tweens();
  }

  _enableMorphTargets(enable) {
    material.morphTargets = enable;
    material.morphNormals = enable;
    material.needsUpdate = true;
  }

  render(definition, resolution) {
    this._tweens.stopAll();

    const {animatable} = this._surface.generate(definition, resolution);
    mesh.geometry = this._surface.geometry;

    if (animatable) {
      this._enableMorphTargets(true);
      mesh.morphTargetInfluences = [1];
      this._tweens.create(mesh.morphTargetInfluences)
        .duration(3000)
        .to({0: 0})
        .onComplete(() => this._enableMorphTargets(false))
        .onUpdate(render)
        .start();
    }
    else {
      this._enableMorphTargets(false);
      render();
    }
  }

  destroy() {
    this._surface.dispose();
    this._tweens.stopAll();
    mesh.morphTargetInfluences = [0];
    this._enableMorphTargets(false);
  }
}

class ImplicitGeometry {
  constructor() {
    this._highQualitySurface = new ImplicitSurface();
    this._lowQualitySurface = new ImplicitSurface();
    this._implicitSurfaceAnimator = new ImplicitSurfaceAnimator();

    let usingHighQualitySurface = false;

    this._highQualityGenerate = debounce(() => {
      const r = Math.round(Math.pow(10, 1/3) * this._resolution);
      this._highQualitySurface.generate(this._implicitSurfaceAnimator.equation, orbitControls.center, orbitControls.radius, r);
      mesh.geometry = this._highQualitySurface.geometry;
      usingHighQualitySurface = true;
      render();
    }, 150);

    this._lowQualityGenerate = throttleAnimationFrame(() => {
      this._lowQualitySurface.generate(this._implicitSurfaceAnimator.equation, orbitControls.center, orbitControls.radius, this._resolution);
      mesh.geometry = this._lowQualitySurface.geometry;
      usingHighQualitySurface = false;
      render();
      this._highQualityGenerate.function();
    });

    this._implicitSurfaceAnimator.onUpdate = this._lowQualityGenerate.function;
    orbitControls.onPan = this._lowQualityGenerate.function;
    orbitControls.onScale = this._lowQualityGenerate.function;
    orbitControls.onRotate = () => {
      if (!usingHighQualitySurface) {
        this._highQualityGenerate.function();
      }
    };
  }

  render(equation, resolution, morphDuration, oscillate) {
    this._resolution = resolution;
    this._implicitSurfaceAnimator.morph(equation, morphDuration, oscillate);
  }

  destroy() {
    this._lowQualitySurface.dispose();
    this._highQualitySurface.dispose();
    this._implicitSurfaceAnimator.stop();
    this._lowQualityGenerate.cancel();
    this._highQualityGenerate.cancel();
    orbitControls.onPan = null;
    orbitControls.onScale = null;
    orbitControls.onRotate = null;
  }
}

function setEnvironment({cubemap, lights}) {
  scene.remove(...scene.children);
  scene.add(mesh);
  if (cubemap) {
    scene.background = cubemap;
    material.envMap = cubemap;
  }
  if (lights) {
    scene.add(lights);
  }
  material.needsUpdate = true;
  render();
}

let materialProperties = {};

function setMaterialOptions({uvScale, useParallaxMap}) {
  material.uniforms.uvScale.value = uvScale;
  material.parallaxMap = useParallaxMap ? materialProperties.parallaxMap : null;
  material.needsUpdate = true;
  render();
}

function setMaterial(properties, options) {
  materialProperties = properties;

  for (let [prop, value] of Object.entries(properties)) {
    if (material[prop] instanceof THREE.Texture) {
      material[prop].dispose();
    }
    material[prop] = value;
  }

  setMaterialOptions(options);
}

function enableShadows(enable) {
  renderer.shadowMap.enabled = enable;
  material.needsUpdate = true;
  render();
}

const environmentLoader = new EnvironmentLoader('/presets/environments');
const materialLoader = new MaterialLoader('/presets/materials', renderer.capabilities.getMaxAnisotropy());

window.addEventListener('resize', resize);
resize();

// ---------------
// User Interface
// ---------------

const loadPrompt = document.getElementById('loadPrompt');

THREE.DefaultLoadingManager.onStart = () => {
  loadPrompt.style.display = '';
};

THREE.DefaultLoadingManager.onLoad = () => {
  loadPrompt.style.display = 'none';
};

const graphicsControls = new GraphicsControls();

graphicsControls.onEnvironment = name => {
  environmentLoader.load(name)
    .then(setEnvironment)
    .catch(() => {}); // user switched scene mid-download
};

graphicsControls.onMaterial = name => {
  materialLoader.load(name)
    .then(properties => {
      setMaterial(properties, graphicsControls.materialOptions);
    })
    .catch(() => {}); // user switched material mid-download
};

graphicsControls.onMaterialOptions = setMaterialOptions;
graphicsControls.onEnableShadows = enableShadows;

const surfaceControls = new Tabs();

let activeGeometry;
let firstLoad = true;

const implicitControls = new ImplicitControls();

surfaceControls.add('Implicit', implicitControls.domElement, () => {
  orbitControls.resetPosition();

  if (activeGeometry) {
    activeGeometry.destroy();
  }
  activeGeometry = new ImplicitGeometry();

  const setGeometryFromControls = morphDuration => {
    const resolution = [25, 50, 60][graphicsControls.meshQuality];
    activeGeometry.render(implicitControls.equation, resolution, morphDuration, implicitControls.oscillate);
  };

  implicitControls.onEquation = () => setGeometryFromControls(4000);
  implicitControls.onOscillate = () => setGeometryFromControls(2000);
  graphicsControls.onMeshQuality = () => setGeometryFromControls(0);

  setGeometryFromControls(firstLoad ? 10000 : 0);

  firstLoad = false;
});

const parametricControls = new ParametricControls();

surfaceControls.add('Parametric', parametricControls.domElement, () => {
  orbitControls.resetPosition();

  if (activeGeometry) {
    activeGeometry.destroy();
  }
  activeGeometry = new ParametricGeometry();

  const setGeometryFromControls = () => {
    const resolution = [64, 128, 256][graphicsControls.meshQuality];
    activeGeometry.render(parametricControls.definition, resolution);
  };

  parametricControls.onDefinition = setGeometryFromControls;
  graphicsControls.onMeshQuality = setGeometryFromControls;

  setGeometryFromControls();

  firstLoad = false;
});

buildDomTree(
  document.getElementById('inputs'), [
    createElem('h2', {class: 'withTabs'}, 'Surface Type'),
    surfaceControls.domElement,
    createElem('h2', null, 'Graphics'),
    graphicsControls.domElement
  ]
);

setEnvironment(environmentLoader.default);

request('/presets/index.json').promise
  .then(names => {
    graphicsControls.addEnvironments(names.environments);
    graphicsControls.addMaterials(names.materials);
  });
