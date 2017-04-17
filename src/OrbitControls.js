import * as THREE from 'three';
import { clamp, detachableEvents } from './util';

const v = new THREE.Vector3();

export default class {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.radius = 3;
    this.center = new THREE.Vector3();
    this.matrixNeedsUpdate = true;

    this.panSensitivity = 0.0006;
    this.rotateSensitivity = 0.0012;
    this.scaleSensitivity = 1.1;

    this._mouseAction;
    this._detachEvents = detachableEvents([
      {
        element: domElement,
        type: 'mousedown',
        callback: () => {
          this.domElement.requestPointerLock();
          this._mouseAction = this._mousePan;
        }
      },

      {
        element: window,
        type: 'mouseup',
        callback: () => this._mouseAction = this._mouseRotate
      },
      {
        element: domElement,
        type: 'mousemove',
        callback: e => {
          if (document.pointerLockElement !== this.domElement) {
            return;
          }
          this._mouseAction(e);
        }
      },
      {
        element: domElement,
        type: 'wheel',
        callback: e => {
          this.scale(Math.pow(this.scaleSensitivity, Math.sign(e.deltaY)));
        }
      }
    ]);
  }

  _mouseRotate(e) {
    this.rotate(e.movementX * this.rotateSensitivity, e.movementY * this.rotateSensitivity);
  }

  _mousePan(e) {
    this.pan(e.movementX * this.panSensitivity * this.radius, -e.movementY * this.panSensitivity * this.radius);
  }

  update() {
    if (this.matrixNeedsUpdate) {
      const forward = v.set(0, 0, 1).applyQuaternion(this.camera.quaternion);
      this.camera.position.addVectors(this.center, forward.multiplyScalar(this.radius));

      this.camera.updateMatrix();
      this.matrixNeedsUpdate = false;
    }
  }

  scale(amount) {
    this.radius *= amount;
    this.matrixNeedsUpdate = true;
  }

  rotate(dx, dy) {
    this.camera.rotation.set(
      clamp(this.camera.rotation.x - dy, -Math.PI / 2, Math.PI / 2),
      (this.camera.rotation.y - dx) % (2 * Math.PI),
      this.camera.rotation.z,
      'ZYX'
    );

    this.matrixNeedsUpdate = true;
  }

  pan(dx, dy) {
    const right = v.set(dx, 0, 0).applyQuaternion(this.camera.quaternion);
    this.center.add(right);

    const up = v.set(0, dy, 0).applyQuaternion(this.camera.quaternion);
    this.center.add(up);

    this.matrixNeedsUpdate = true;
  }

  detach() {
    this._detachEvents();
  }
}