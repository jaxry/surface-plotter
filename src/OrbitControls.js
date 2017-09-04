import * as THREE from 'three';
import { clamp, detachableEvents } from './util';

const v = new THREE.Vector3();
const q = new THREE.Quaternion();

export default class {
  constructor(camera, object, domElement) {
    this.camera = camera;
    this.object = object;
    this.domElement = domElement;

    this.radius = 3;
    this.center = new THREE.Vector3();
    this.update();

    this.panSensitivity = 0.0005;
    this.rotateSensitivity = 0.0012;
    this.scaleSensitivity = 1.1;
    this._mouseAction;
    this._detachEvents = detachableEvents(
      {
        element: domElement,
        type: 'mousedown',
        callback: e => {
          this.domElement.requestPointerLock();
          this._mouseAction = e.which === 1 ? this._mousePan : this._mouseObject;
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
    );
  }

  _mouseRotate(e) {
    this.rotate(e.movementX * this.rotateSensitivity, e.movementY * this.rotateSensitivity);
  }

  _mousePan(e) {
    this.pan(e.movementX * this.panSensitivity , -e.movementY * this.panSensitivity);
  }

  _mouseObject(e) {
    this.objectRotate(e.movementX * this.rotateSensitivity, e.movementY * this.rotateSensitivity);
  }

  update() {
    this.camera.position.set(0, 0, 1).applyQuaternion(this.camera.quaternion);
    this.camera.updateMatrix();

    this.object.scale.setScalar(1 / this.radius);
    this.object.position.copy(this.center).divideScalar(this.radius).negate();
    this.object.updateMatrix();

    if (this.onUpdate) {
      this.onUpdate();
    }
  }

  scale(amount) {
    this.radius *= amount;

    if (this.onScale) {
      this.onScale();
    }

    this.update();
  }

  rotate(dx, dy) {
    this.camera.rotation.set(
      clamp(this.camera.rotation.x - dy, -Math.PI / 2, Math.PI / 2),
      (this.camera.rotation.y - dx) % (2 * Math.PI),
      this.camera.rotation.z,
      'ZYX'
    );

    this.update();
  }

  pan(dx, dy) {
    const right = v.set(dx * this.radius, 0, 0).applyQuaternion(this.camera.quaternion);
    this.center.add(right);

    const up = v.set(0, dy * this.radius, 0).applyQuaternion(this.camera.quaternion);
    this.center.add(up);

    if (this.onPan) {
      this.onPan();
    }

    this.update();
  }

  objectRotate(dx, dy) {
    const up = v.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
    q.setFromAxisAngle(up, dx);
    this.object.quaternion.premultiply(q);

    const right = v.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    q.setFromAxisAngle(right, dy);
    this.object.quaternion.premultiply(q);

    this.update();
  }

  detach() {
    this._detachEvents();
  }
}