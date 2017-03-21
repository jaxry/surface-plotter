import {vec3} from 'gl-matrix';
import Camera from './Camera';
import {detachableEvents} from './util';

export default class {
  constructor(canvas) {
    this.canvas = canvas;
    this.camera = new Camera();
    this.mouseSensitivity = 0.001;
    this.moveSensitivity = 0.0008;
    this.scaleSensitivity = 1.1;

    this.useArcball = true;
    this.scale = 1;

    this._keyBindings = {
      w: this._translate('add', () => this.camera.getForward()),
      s: this._translate('sub', () => this.camera.getForward()),
      d: this._translate('add', () => this.camera.getRight()),
      a: this._translate('sub', () => this.camera.getRight()),
      ' ': this._translate('add', () => this.camera.getUp()),
      x: this._translate('sub', () => this.camera.getUp()),
    };
 
    this._actions = new Set();
    this._t = vec3.create();

    // events
    this._rotate = e => {
      if (document.pointerLockElement !== this.canvas) {
        return;
      }
      const dx = e.movementX;
      const dy = e.movementY;

      if (this.useArcball) {
        this._arcballRotate(dx, dy);
      }
      else {
        this._fpsRotate(dx, dy);
      }
    };

    this._addAction = e => {
      const action = this._keyBindings[e.key];
      if (!action) {
        return;
      }
      this._actions.add(action);
    };

    this._removeAction = e => {
      const action = this._keyBindings[e.key];
      if (!action) {
        return;
      }
      this._actions.delete(action);
    };

    this._pointerlock = () => {
      this.canvas.requestPointerLock();
    };

    this._toggleArcball = () => {
      this.useArcball = !this.useArcball;
    };

    this._changeScale = (e) => {
      e.preventDefault();
      const oldScale = this.scale;

      this.scale *= Math.pow(this.scaleSensitivity, Math.sign(e.deltaY));

      if (this.useArcball) {
        vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.getForward(), oldScale - this.scale);
      }
    };

    this._detachEvents = detachableEvents([
      {element: this.canvas, type: 'mousemove', callback: this._rotate},
      {element: this.canvas, type: 'keydown', callback: this._addAction},
      {element: window, type: 'keyup', callback: this._removeAction},
      {element: this.canvas, type: 'mousedown', callback: this._pointerlock},
      {element: this.canvas, type: 'wheel', callback: this._changeScale}
    ]);
  }

  _translate(operation, getVec3) {
    return () => vec3[operation](this._t, this._t, getVec3());
  }

  _fpsRotate(dx, dy) {
    this.camera.rotate(-this.mouseSensitivity * dy, -this.mouseSensitivity * dx);
  }

  _arcballRotate(dx, dy) {
    vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.getForward(), this.scale);
    this.camera.rotate(-this.mouseSensitivity * dy, -this.mouseSensitivity * dx);
    this.camera.updateRotation();
    vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.getForward(), -this.scale);
  }

  center(point) {
    vec3.scaleAndAdd(this.camera.position, point, this.camera.getForward(), -this.scale);
  }

  update(dt) {    
    if (!this._actions.size) {
      return;
    }
    vec3.set(this._t, 0, 0, 0);

    for (let action of this._actions) {
      action();
    }

    vec3.scale(this._t, this._t, this.scale * dt * this.moveSensitivity);
    this.camera.translate(this._t);
  }

  detach() {
    this._detachEvents();
  }
}