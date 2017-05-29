/*

 Implicit Surface polygonizer
 Uses front-based propagation as described by Hartmann in:
 Erich Hartmann. 1998. A marching method for the triangulation of surfaces. Visual Computer 14, 2, 95-108

 TODO:
 Extend method to use adaptive polygonization as described in:
 Bruno Rodrigues de Araujo and Joaquim Armando Pires Jorge. 2005a. Adaptive polygonization of implicit surfaces. Computers and Graphics 29, 5, 686–696

*/

import * as THREE from 'three';
import { mod } from './util';

const Vector2 = THREE.Vector2;
const Vector3 = THREE.Vector3;
const Box3 = THREE.Box3;

const EPS = 0.0001;
const TWOPI = 2 * Math.PI;

const temp = new Vector3();
const projectSteps = 4;
const stepLength = 0.25;
const stepLS = stepLength * stepLength;

export default class {
  constructor(pushVertex, pushTriangle) {
    this._pushVertex = pushVertex;
    this._pushTriangle = pushTriangle;
    this.center = new Vector3(0, 0, 0);
    this.scale = 7;
    this._scale2 = this.scale * this.scale;
  }

  _grad(out, p, fp) {
    out.x = (this.eq(p.x + EPS, p.y, p.z) - fp) / EPS;
    out.y = (this.eq(p.x, p.y + EPS, p.z) - fp) / EPS;
    out.z = (this.eq(p.x, p.y, p.z + EPS) - fp) / EPS;

    return out;
  }

  _surfacePoint(p, iters) {
    let fp, g2;

    for(let i = 0; i < iters; i++) {
      fp = this.eq(p.x, p.y, p.z);
      this._grad(temp, p, fp);
      g2 = temp.lengthSq();
      p.addScaledVector(temp, -fp / g2);
    }

    return p;
  }

  _getNormal(p) {
    return this._grad(new Vector3(), p, this.eq(p.x, p.y, p.z)).normalize();
  }

  _getBasis(p) {
    const n = this._getNormal(p);

    const t1 = n.x > 0.5 || n.y > 0.5 ?
      new Vector3(n.y, -n.x, 0).normalize() :
      new Vector3(-n.z, 0, n.x).normalize();

    const t2 = new Vector3().crossVectors(n, t1);

    return {
      n, t1, t2
    };
  }

  _createFrontPoint(position) {
    const l2 = position.distanceToSquared(this.center);

    if (l2 > this._scale2) {
      position.multiplyScalar(this.scale / Math.sqrt(l2));

      return {
        index: this._pushVertex(position, this._getNormal(position)),
        position,
        border: true
      };
    }

    const basis = this._getBasis(position);

    return {
      index: this._pushVertex(position, basis.n),
      position,
      basis,
      angle: 0,
      baseAngle: 0,
      updateAngle: true,
      rotationOrigin: new Vector2(),
      distanceCheck: true
    };
  }

  _initSeed(front) {
    const seed = this._surfacePoint(new THREE.Vector3(1, 1, 1), 10);
    const seedBasis = this._getBasis(seed);
    this._pushVertex(seed, seedBasis.n);

    for(let i = 0; i < 6; i++) {
      const p = seed.clone()
        .addScaledVector(seedBasis.t1, stepLength * Math.cos(i * Math.PI / 3))
        .addScaledVector(seedBasis.t2, stepLength * Math.sin(i * Math.PI / 3));

      this._surfacePoint(p, projectSteps);

      front.push(this._createFrontPoint(p));
    }

    for (let i = 0; i < front.length; i++) {
      this._pushTriangle(0, front[mod(i - 1, front.length)].index, front[i].index);
    }
  }

  _calcAngle(front, index) {
    const frontPoint = front[index];
    const leftNeighbor = front[mod(index - 1, front.length)];
    const rightNeighbor = front[mod(index + 1, front.length)];

    const {t1, t2} = frontPoint.basis;
    const rotationOrigin = frontPoint.rotationOrigin;

    temp.subVectors(leftNeighbor.position, frontPoint.position);
    rotationOrigin.set(t1.dot(temp), t2.dot(temp));
    const w1 = Math.atan2(rotationOrigin.y, rotationOrigin.x);

    temp.subVectors(rightNeighbor.position, frontPoint.position);
    const w2 = Math.atan2(t2.dot(temp), t1.dot(temp));

    const w = mod(w2 - w1, TWOPI);

    frontPoint.angle = w;
    frontPoint.baseAngle = w1;
    frontPoint.updateAngle = false;

    return w;
  }

  _expandFront(front, index) {
    const frontPoint = front[index];
    const leftNeighbor = front[mod(index - 1, front.length)];
    const rightNeighbor = front[mod(index + 1, front.length)];

    const angle = frontPoint.angle;

    let numTriangles = Math.floor(3 * frontPoint.angle / Math.PI) + 1;
    let rotation = angle / numTriangles;

    if (rotation < 0.8 && numTriangles > 1) {
      rotation = angle / --numTriangles;
    }
    else if (numTriangles === 1 && rotation > 0.8 && leftNeighbor.position.distanceToSquared(rightNeighbor.position) > stepLS * 1.44) {
      numTriangles = 2;
      rotation /= 2;
    }
    else if (angle < 3 && (leftNeighbor.position.distanceToSquared(frontPoint.position) <= 0.25 * stepLS || rightNeighbor.position.distanceToSquared(frontPoint.position) <= 0.25 * stepLS) ) {
      numTriangles = 1;
    }

    leftNeighbor.updateAngle = true;
    rightNeighbor.updateAngle = true;

    if (numTriangles === 1) {
      this._pushTriangle(leftNeighbor.index, rightNeighbor.index, frontPoint.index);
      front.splice(index, 1);
      return;
    }

    const points = [];

    frontPoint.rotationOrigin.normalize();

    for (let i = 1; i < numTriangles; i++) {
      const c = Math.cos(rotation * i);
      const s = Math.sin(rotation * i);
      const x = c * frontPoint.rotationOrigin.x - s * frontPoint.rotationOrigin.y;
      const y = s * frontPoint.rotationOrigin.x + c * frontPoint.rotationOrigin.y;

      const position = new THREE.Vector3()
        .addScaledVector(frontPoint.basis.t1, stepLength * x)
        .addScaledVector(frontPoint.basis.t2, stepLength * y)
        .add(frontPoint.position);

      this._surfacePoint(position, projectSteps);

      const f = this._createFrontPoint(position);

      if (i === 1) {
        this._pushTriangle(leftNeighbor.index, f.index, frontPoint.index);
      }
      if (i === numTriangles - 1) {
        this._pushTriangle(f.index, rightNeighbor.index, frontPoint.index);
      }
      else {
        this._pushTriangle(f.index, f.index + 1, frontPoint.index);
      }

      points.push(f);
    }

    front.splice(index, 1, ...points);
  }

  _intrafrontCollisions(fronts, front, index) {
    const f = front[index];

    for (let i = 0; i < front.length - 5; i++) {
      const targetIndex = mod(i + index + 3, front.length);
      const target = front[targetIndex];

      if (target.border || target.position.distanceToSquared(f.position) > stepLS) {
        continue;
      }

      temp.subVectors(target.position, f.position);
      const wt = Math.atan2(f.basis.t2.dot(temp), f.basis.t1.dot(temp));
      const w = mod(wt - f.baseAngle, TWOPI);

      if (w > f.angle) {
        continue; // point on target front is not visible to point on active front
      }

      f.updateAngle = true;
      target.updateAngle = true;

      let newFront;

      if (targetIndex < index) {
        newFront = front.splice(targetIndex + 1, index - targetIndex - 1);
        newFront.unshift(Object.assign({} , target));
        newFront.push(Object.assign({}, f));
      }
      else {
        newFront = front.splice(index + 1, targetIndex - index - 1);
        newFront.unshift(Object.assign({} , f));
        newFront.push(Object.assign({}, target));
      }

      if (this._calcAngle(newFront, 0) < this._calcAngle(newFront, newFront.length - 1)) {
        this._expandFront(newFront, 0);
        this._calcAngle(newFront, newFront.length - 1);
        this._expandFront(newFront, newFront.length - 1);
      }
      else {
        this._expandFront(newFront, newFront.length - 1);
        this._calcAngle(newFront, 0);
        this._expandFront(newFront, 0);
      }

      const newFrontBox = new Box3();

      for (let nf of newFront) {
        newFrontBox.expandByPoint(nf.position);
      }

      newFrontBox.expandByScalar(stepLength);

      fronts.push({
        front: newFront,
        box: newFrontBox
      });

      return true;
    }
  }

  _interfrontCollisions(fronts, front, index) {
    const f = front[index];

    for (let i = 0; i < fronts.length; i++) {
      const {front: targetFront, box: targetBox} = fronts[i];

      if (!targetBox.containsPoint(f.position)) {
        continue;
      }

      for (let j = 0; j < targetFront.length; j++) {
        const target = targetFront[j];

        if (target.border || targetFront[j].position.distanceToSquared(f.position) > stepLS || target.basis.n.dot(f.basis.n) < 0) {
          continue;
        }

        temp.subVectors(target.position, f.position);
        const wt = Math.atan2(f.basis.t2.dot(temp), f.basis.t1.dot(temp));
        const w = mod(wt - f.baseAngle, TWOPI);

        if (w > f.angle) {
          continue; // point on target front is not visible to point on active front
        }

        const frontHalf = front.splice(index + 1);

        front.push(target, targetFront[mod(j + 1, targetFront.length)]);

        if (this._calcAngle(front, index) < this._calcAngle(front, front.length - 2)) {
          this._expandFront(front, index);
          this._calcAngle(front, front.length - 2);
          this._expandFront(front, front.length - 2);
        }
        else {
          this._expandFront(front, front.length - 2);
          this._calcAngle(front, index);
          this._expandFront(front, index);
        }

        for (let k = 2; k <= targetFront.length; k++) {
          front.push(targetFront[mod(j + k, targetFront.length)]);
        }

        front.push(f, ...frontHalf);

        f.updateAngle = true;
        target.updateAngle = true;

        fronts.splice(i, 1);

        return true;
      }
    }
  }

  triangulate(equation) {
    console.time('polygonize');

    this.eq = equation;

    const fronts = [];
    let front = []; // the active front

    this._initSeed(front);

    let iter = 0;
    let minFront;
    let minFrontIndex;

    do {
      minFront = null;

      for (let i = 0; i < front.length; i++) {
        const f = front[i];

        if (f.border) {
          continue;
        }

        if (!minFront) {
          minFrontIndex = i;
          minFront = f;
        }

        if (f.updateAngle) {
          this._calcAngle(front, i);
        }

        if (f.angle < minFront.angle) {
          minFrontIndex = i;
          minFront = f;
        }
      }

      if (minFront) {
        const collides = this._intrafrontCollisions(fronts, front, minFrontIndex) ||
          this._interfrontCollisions(fronts, front, minFrontIndex);

        if (!collides) {
          this._expandFront(front, minFrontIndex);
        }
      }
      else {
        const newFront = fronts.pop();
        front = newFront && newFront.front;
      }

    } while (front && iter++ < 32000);

    console.timeEnd('polygonize');
    console.log(iter);
  }
}