import * as THREE from 'three';
import Tweens from './Tweens';
import ParametricSurface from './ParametricSurface';
import OrbitControls from './OrbitControls';
import EnvironmentLoader from './EnvironmentLoader';
import MaterialLoader from './MaterialLoader';
import Tabs from './components/Tabs';
import ParametricControls from './components/ParametricControls';
import GraphicsControls from './components/GraphicsControls';
import { createElem, buildDomTree, throttleAnimationFrame } from './util';

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

const material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0.5,
  metalness: 0,
  morphTargets: true,
  morphNormals: true,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh();
mesh.material = material;
mesh.frustumCulled = false;
mesh.castShadow = true;
mesh.receiveShadow = true;

const orbitControls = new OrbitControls(camera, mesh, canvas);
orbitControls.onUpdate = render;

const parametricSurface = new ParametricSurface();
const tweens = new Tweens();

let materialProperties = {};

function setDisplacementScale(surfaceScale, surfaceTiles) {
  const baseScale = 0.04;
  const ds = materialProperties.displacementScale || 0;

  material.displacementScale = baseScale * surfaceScale * ds / surfaceTiles;
  material.displacementBias = -0.5 * material.displacementScale;
  material.needsUpdate = true;
}

function setParametricGeometry(definition) {
  const {animatable, center} = parametricSurface.generate(definition);

  setDisplacementScale(parametricSurface.scale, parametricSurface.tiles);

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

  mesh.geometry = parametricSurface.geometry;
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

function setMaterialOptions({tiles}) {
  setDisplacementScale(parametricSurface.scale, tiles);
  parametricSurface.updateUvs(tiles);

  material.needsUpdate = true;
  render();
}

const environmentLoader = new EnvironmentLoader('/presets/environments');
const materialLoader = new MaterialLoader('/presets/materials', renderer.getMaxAnisotropy());

const graphicsControls = new GraphicsControls();

graphicsControls.onEnvironment = name => {
  environmentLoader.load(name)
    .then(setEnvironment);
};

graphicsControls.onMaterial = name => {
  materialLoader.load(name)
    .then(properties => {
      materialProperties = properties;
      Object.assign(material, properties);
      setMaterialOptions(graphicsControls.materialOptions);
    });
};

graphicsControls.onMaterialOptions = setMaterialOptions;

const parametricControls = new ParametricControls();
parametricControls.onDefinition = setParametricGeometry;
setParametricGeometry(parametricControls.definition);

const surfaceControls = new Tabs();
surfaceControls.add('Parametric', parametricControls.domElement);
surfaceControls.add('Implicit', createElem('div', null, '<p>Not implemented</p>'));

buildDomTree(
  document.getElementById('controls'), [
    createElem('h2', {class: 'withTabs'}, 'Surface Type'),
    surfaceControls.domElement,
    createElem('h2', null, 'Graphics'),
    graphicsControls.domElement
  ]
);

window.addEventListener('resize', resize);
resize();

environmentLoader.init
  .then(names => graphicsControls.addEnvironments(names));
materialLoader.init
  .then(names => graphicsControls.addMaterials(names));