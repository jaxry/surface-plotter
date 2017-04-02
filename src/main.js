import * as THREE from 'three';
import Tweens from './Tweens';
import ParametricSurface from './ParametricSurface';
import OrbitControls from './OrbitControls';
import Tabs from './components/Tabs';
import ParametricControls from './components/ParametricControls';

THREE.Object3D.DefaultMatrixAutoUpdate = false;

const canvas = document.getElementById('plot');

var renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setFaceCulling(THREE.CullFaceNone);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 500);
const tweens = new Tweens();

const texture = new THREE.TextureLoader().load('images/UV_Grid_Sm.jpg');
texture.anisotropy = renderer.getMaxAnisotropy();
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;

const material = new THREE.MeshBasicMaterial({
  // wireframe: true,
  map: texture,
  morphTargets: true,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh();
mesh.material = material;
mesh.frustrumCulled = false;

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

const parametricControls = new ParametricControls();
document.getElementById('controls').appendChild(parametricControls.domElement);
parametricControls.onDefinition = setGeometry;
setGeometry(parametricControls.getDefinition());

window.addEventListener('resize', resize);
resize();
render();