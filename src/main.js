import {vec3, mat4} from 'gl-matrix';
import GlUtil from './GlUtil';
import FpsControls from './FpsControls';
import ParametricSurface from './ParametricSurface';

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
const parametricSurface = new ParametricSurface(gl);

const vs = glUtil.makeVertexShader(vert3d);
const fs = glUtil.makeFragmentShader(frag3d);
const program = glUtil.makeProgram(vs, fs);
gl.linkProgram(program);

const uniforms = glUtil.getUniformLocations(program);

gl.useProgram(program);

const viewProjection = mat4.create();
const proj = mat4.create();
const model = mat4.create();

let lastTime = Date.now();
const startTime = Date.now();

function render() {
  const now = Date.now();
  const dt = now - lastTime;
  const elapsed = now - startTime;

  lastTime = now;

  fpsControls.update(dt);

  const view = fpsControls.camera.getView();

  mat4.mul(viewProjection, proj, view);
  // mat4.mul(mvp, mvp, model);

  gl.uniform3fv(uniforms.uCamPos, fpsControls.camera.position);
  gl.uniform3fv(uniforms.uLightPos, fpsControls.camera.position);
  gl.uniformMatrix4fv(uniforms.uModel, false, model);
  gl.uniformMatrix4fv(uniforms.uViewProjection, false, viewProjection);

  gl.clear(gl.COLOR_BUFFER_BIT);

  parametricSurface.render(elapsed);

  requestAnimationFrame(render);
}

function resize() {
  canvas.width = 0;
  canvas.height = 0;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  mat4.perspective(proj, 60 * Math.PI / 180, canvas.width / canvas.height, 0.1, 500);
}

const parametricControls = new ParametricControls();

parametricControls.ondefinition = definition => {
  parametricSurface.generate(definition);
};

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1);

fpsControls.center(vec3.fromValues(0, 0, 0));
mat4.fromScaling(model, [0.25, 0.25, 0.25]);

parametricSurface.generate(parametricControls.getDefinition());
document.getElementById('plotControls').appendChild(parametricControls.domElement);
window.addEventListener('resize', resize);

resize();
render();