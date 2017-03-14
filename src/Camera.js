import {vec3, mat4} from 'gl-matrix';
import {clamp} from './util';

export default class {
  constructor() {
    this.view = mat4.create();
    this.transform = mat4.create();
    this.position = vec3.create();
    this.rotation = {x: 0, y: 0};

    this._t = vec3.create();
  }

  getForward() {
    vec3.set(this._t, -this.view[2], -this.view[6], -this.view[10]);
    return this._t;
  }

  getUp() {
    vec3.set(this._t, this.view[1], this.view[5], this.view[9]);
    return this._t;
  }

  getRight() {
    vec3.set(this._t, this.view[0], this.view[4], this.view[8]);
    return this._t;
  }

  rotate(x, y) {
    this.rotation.x = clamp(this.rotation.x + x, -Math.PI / 2, Math.PI / 2);
    this.rotation.y = (this.rotation.y + y) % (2 * Math.PI);
  }

  translate(v) {
    vec3.add(this.position, this.position, v);
  }

  updateRotation() {
    mat4.fromXRotation(this.view, -this.rotation.x);
    mat4.rotateY(this.view, this.view, -this.rotation.y);
  }

  update() {
    this.updateRotation();
    mat4.translate(this.view, this.view, [-this.position[0], -this.position[1], -this.position[2]]);
  }
  
  getView() {
    this.update();

    return this.view;
  }
}