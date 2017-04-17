import * as THREE from 'three';
import Tweens from './Tweens';
import ParametricSurface from './ParametricSurface';
import OrbitControls from './OrbitControls';
import EnvironmentLoader from './EnvironmentLoader';
import Tabs from './components/Tabs';
import ParametricControls from './components/ParametricControls';
import GraphicsControls from './components/GraphicsControls';
import { createElem, buildDomTree } from './util';

const canvas = document.getElementById('plot');

THREE.Object3D.DefaultMatrixAutoUpdate = false;

var renderer = new THREE.WebGLRenderer({
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
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 500);
const tweens = new Tweens();

const material = new THREE.MeshPhysicalMaterial({
  color: 0x00ff00,
  roughness: 0.3,
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
scene.add(mesh);

const orbitControls = new OrbitControls(camera, canvas);
const parametricSurface = new ParametricSurface();

function render() {
  orbitControls.update();
  tweens.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resize() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function setGeometry(definition) {
  const {animatable, center} = parametricSurface.generate(definition);
  if (animatable) {
    mesh.morphTargetInfluences = [1];
    tweens.create(mesh.morphTargetInfluences)
      .to({0: 0})
      .start();
  }
  tweens.create(orbitControls.center)
    .to(center)
    .onUpdate(() => {
      orbitControls.matrixNeedsUpdate = true;
    })
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
}

const environmentLoader = new EnvironmentLoader('/presets/environments/');

const parametricControls = new ParametricControls();
parametricControls.onDefinition = setGeometry;
setGeometry(parametricControls.getDefinition());

const surfaceControls = new Tabs();
surfaceControls.add('Parametric', parametricControls.domElement);
surfaceControls.add('Implicit', createElem('div', null, '<p>Not implemented</p>'));

const graphicsControls = new GraphicsControls();
graphicsControls.onEnvironmentChange = name => {
  environmentLoader.load(name).then(setEnvironment);
};

environmentLoader.init
  .then(names => graphicsControls.addEnvironments(names));

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
render();