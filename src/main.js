import * as THREE from 'three';
import Tweens from './Tweens';
import ParametricSurface from './ParametricSurface';
import ImplicitSurface from './ImplicitSurface';
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
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
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
  morphTargets: true,
  morphNormals: true,
  side: THREE.DoubleSide
});
material.color = 0xffffff;
material.normalScale = new THREE.Vector2(1, -1);

// const material = new THREE.MeshNormalMaterial({
  // wireframe: true,
  // side: THREE.DoubleSide
// });

const mesh = new THREE.Mesh();
mesh.material = material;
mesh.frustumCulled = false;
mesh.castShadow = true;
mesh.receiveShadow = true;

const orbitControls = new OrbitControls(camera, mesh, canvas);
orbitControls.onUpdate = render;

const tweens = new Tweens();

let surface;

function initSurface(Surface) {
  if (surface instanceof Surface) {
    return surface;
  }

  if (surface && surface.geometry) {
    surface.geometry.dispose();
  }

  surface = new Surface();

  return surface;
}

function setParametricGeometry(definition, resolution) {
  const surface = initSurface(ParametricSurface);
  orbitControls.onPan = null;
  orbitControls.onScale = null;

  const {animatable, center} = surface.generate(definition, resolution);

  if (animatable) {
    mesh.morphTargetInfluences = [1];
    tweens.create(mesh.morphTargetInfluences)
      .to({0: 0})
      .start();
  }
  tweens.create(orbitControls.center)
    .to(center)
    .onUpdate(() => orbitControls.update())
    .start();

  mesh.geometry = surface.geometry;
}

function setImplicitGeometry(definition, resolution) {
  const surface = initSurface(ImplicitSurface);

  const generate = () => {
    surface.generate(definition, orbitControls.center, orbitControls.radius, resolution);
    mesh.geometry = surface.geometry;
  };

  orbitControls.onPan = throttleAnimationFrame(generate);
  orbitControls.onScale = throttleAnimationFrame(generate);

  generate();

  render();
}

function setEnvironment({cubemap, lights}) {
  scene.remove(...scene.children);
  scene.add(mesh);
  scene.add(lights);
  scene.background = cubemap;
  material.envMap = cubemap;
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

const graphicsControls = new GraphicsControls();

graphicsControls.onEnvironment = name => {
  environmentLoader.load(name).then(setEnvironment);
};

graphicsControls.onMaterial = name => {
  materialLoader.load(name).then(properties => {
    setMaterial(properties, graphicsControls.materialOptions);
  });
};

graphicsControls.onMaterialOptions = setMaterialOptions;

let setActiveGeometry;

const parametricControls = new ParametricControls();

function setParametricGeometryFromControls() {
  const resolution = [64, 128, 256][graphicsControls.meshQuality];
  setParametricGeometry(parametricControls.definition, resolution);
  setActiveGeometry = setParametricGeometryFromControls;
}

parametricControls.onDefinition = setParametricGeometryFromControls;

const implicitControls = new ImplicitControls();

function setImplicitGeometryFromControls() {
  const resolution = [16, 24, 32][graphicsControls.meshQuality];
  setImplicitGeometry(implicitControls.definition, resolution);
  setActiveGeometry = setImplicitGeometryFromControls;
}

implicitControls.onDefinition = setImplicitGeometryFromControls;

graphicsControls.onMeshQuality = () => setActiveGeometry();

const surfaceControls = new Tabs();
surfaceControls.add('Implicit', implicitControls.domElement, setImplicitGeometryFromControls);
surfaceControls.add('Parametric', parametricControls.domElement, setParametricGeometryFromControls);

buildDomTree(
  document.getElementById('controls'), [
    createElem('h2', {class: 'withTabs'}, 'Surface Type'),
    surfaceControls.domElement,
    createElem('h2', null, 'Graphics'),
    graphicsControls.domElement
  ]
);

request('/presets/index.json', 'json')
  .then(names => {
    graphicsControls.addEnvironments(names.environments);
    graphicsControls.addMaterials(names.materials);
  });