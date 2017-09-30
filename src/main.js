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
import { createElem, buildDomTree, throttleAnimationFrame, request } from './util';

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
});

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

class Geometry {
  constructor() {
    this._surface;
  }

  _dispose() {
    if (this._surface.geometry) {
      this._surface.geometry.dispose();
    }
  }

  destroy() {
    mesh.geometry = null;
    this._dispose();
  }
}

class ParametricGeometry extends Geometry {
  constructor() {
    super();
    this._surface = new ParametricSurface();
    this._tweens = new Tweens();
    material.morphTargets = true;
    material.morphNormals = true;
    material.needsUpdate = true;
  }

  render(definition, resolution) {
    this._dispose();

    const {animatable, center} = this._surface.generate(definition, resolution);

    mesh.geometry = this._surface.geometry;

    if (animatable) {
      mesh.morphTargetInfluences = [1];
      this.tween = this._tweens.create(mesh.morphTargetInfluences)
        .duration(2000)
        .to({0: 0})
        .onUpdate(render)
        .start();
    }
    this._tweens.create(orbitControls.center)
      .to(center)
      .onUpdate(() => orbitControls.update())
      .start();

  }
  destroy() {
    super.destroy();
    this._tweens.stopAll();
    mesh.morphTargetInfluences = [0];
    material.morphTargets = false;
    material.morphNormals = false;
    material.needsUpdate = true;
  }
}

class ImplicitGeometry extends Geometry {
  constructor() {
    super();
    this._surface = new ImplicitSurface();
    this._implicitSurfaceAnimator = new ImplicitSurfaceAnimator();
  }

  render(equation, resolution, animate) {
    this._dispose();

    const generate = throttleAnimationFrame(() => {
      this._surface.generate(this._implicitSurfaceAnimator.equation, orbitControls.center, orbitControls.radius, resolution);
      mesh.geometry = this._surface.geometry;
    });

    this._implicitSurfaceAnimator.onUpdate = () => {
      generate();
      render();
    };

    orbitControls.onPan = generate;
    orbitControls.onScale = generate;

    if (animate) {
      this._implicitSurfaceAnimator.animate(equation);
    }
    else {
      this._implicitSurfaceAnimator.skipAnimation(equation);
    }
  }

  destroy() {
    super.destroy();
    this._implicitSurfaceAnimator.stop();
    orbitControls.onPan = null;
    orbitControls.onScale = null;
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

const surfaceControls = new Tabs();

let activeGeometry;
let firstLoad = true;

const implicitControls = new ImplicitControls();

surfaceControls.add('Implicit', implicitControls.domElement, () => {
  if (activeGeometry) {
    activeGeometry.destroy();
  }
  activeGeometry = new ImplicitGeometry();

  const setGeometryFromControls = animate => {
    const resolution = [16, 32, 48][graphicsControls.meshQuality];
    activeGeometry.render(implicitControls.equation, resolution, animate);
  };

  implicitControls.onDefinition = () => setGeometryFromControls(true);
  graphicsControls.onMeshQuality = () => setGeometryFromControls(false);

  setGeometryFromControls(firstLoad);

  firstLoad = false;
});

const parametricControls = new ParametricControls();

surfaceControls.add('Parametric', parametricControls.domElement, () => {
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
  document.getElementById('controls'), [
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