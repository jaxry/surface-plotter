import {vec3, mat4} from 'gl-matrix';

import GlUtil from './GlUtil';
import Geometry from './Geometry';
import FpsControls from './FpsControls';
import parametricSurface from './parametricSurface';
import Timer from './Timer';

import ParametricControls from './components/ParametricControls';

import vert3d from './shaders/3d.vert';
import frag3d from './shaders/3d.frag';

const canvas = document.getElementById('plot');
const gl = canvas.getContext('webgl2', {
  alpha: false,
  antialias: true,
  depth: true,
  stencil: true,
});

const glUtil = new GlUtil(gl);

const fpsControls = new FpsControls(canvas);
const geometry = new Geometry(gl);

const vs = glUtil.makeVertexShader(vert3d);
const fs = glUtil.makeFragmentShader(frag3d);
const program = glUtil.makeProgram(vs, fs);
gl.linkProgram(program);
gl.useProgram(program);

const uniforms = glUtil.getUniformLocations(program);

const mvp = mat4.create();
const proj = mat4.create();
const model = mat4.create();

const timer = new Timer();

function render() {
  timer.update();
  fpsControls.update(timer.dt);

  const view = fpsControls.camera.getView();

  mat4.mul(mvp, proj, view);
  mat4.mul(mvp, mvp, model);

  gl.uniform3fv(uniforms.uCamPos, fpsControls.camera.position);
  gl.uniform3fv(uniforms.uLightPos, fpsControls.camera.position);
  gl.uniformMatrix4fv(uniforms.uModel, false, model);
  gl.uniformMatrix4fv(uniforms.uMVP, false, mvp);

  gl.clear(gl.COLOR_BUFFER_BIT);

  geometry.render();

  requestAnimationFrame(render);
}

function generateMesh(definition) {
  geometry.update(parametricSurface(definition));
}

const parametricControls = new ParametricControls();

document.getElementById('plotControls').appendChild(parametricControls.domElement);
parametricControls.ondefinition = definition => {
  generateMesh(definition);
};

fpsControls.center(vec3.fromValues(0, 0, 0));
mat4.fromScaling(model, [0.25, 0.25, 0.25]);
generateMesh(parametricControls.getDefinition());

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1);

function resize() {
  canvas.width = 0;
  canvas.height = 0;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  mat4.perspective(proj, 60 * Math.PI / 180, canvas.width / canvas.height, 0.1, 500);
}
window.addEventListener('resize', resize);
resize();

render();