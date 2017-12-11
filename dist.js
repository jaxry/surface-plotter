(function (THREE) {
'use strict';

class Tween {
  constructor(factory, fromObj) {
    this._factory = factory;
    this._duration = 1000;
    this._easing = TweenFactory.easing.smootherstep;

    if (fromObj) {
      this.from(fromObj);
    }
  }

  _update(time) {
    let t = (time - this._startTime) / this._duration;

    if (t >= 1) {
      t = 1;
      this._factory._stop(this);
      if (this._onComplete) {
        this._onComplete(1, this._current);
      }
    }

    t = this._easing(t);

    if (this._interpolate) {
      for (let k of this._keys) {
        this._current[k] = (1 - t) * this._from[k] + t * this._to[k];
      }
    }

    if (this._onUpdate) {
      this._onUpdate(t, this._current);
    }
  }

  start() {
    this._startTime = Date.now();
    this._interpolate = this._from && this._to;
    this._factory._start(this);
    if (this._onStart) {
      this._onStart(0, this._current);
    }
    return this;
  }

  stop() {
    this._factory._stop(this);
    return this;
  }

  from(obj) {
    this._from = Object.assign({}, obj);
    this._current = obj;
    return this;
  }

  to(obj) {
    this._to = obj;
    this._keys = Object.keys(obj);
    return this;
  }

  duration(number) {
    this._duration = number;
    return this;
  }

  easing(fn) {
    this._easing = fn;
    return this;
  }

  onStart(fn) {
    this._onStart = fn;
    return this;
  }

  onComplete(fn) {
    this._onComplete = fn;
    return this;
  }

  onUpdate(fn) {
    this._onUpdate = fn;
    return this;
  }

}

class TweenFactory {
  constructor() {
    this.tweens = new Set();
    this.updating = false;
    this._callUpdate = () => this._update();
  }

  create(fromObj) {
    const t = new Tween(this, fromObj);
    return t;
  }

  stopAll() {
    for (let tween of this.tweens) {
      tween.stop();
    }
  }

  onUpdate(fn) {
    this._onUpdate = fn;
    return this;
  }

  _update() {
    if (this.updating) {
      const time = Date.now();
      for (let tween of this.tweens) {
        tween._update(time);
      }
      if (this._onUpdate) {
        this._onUpdate();
      }
      requestAnimationFrame(this._callUpdate);
    }
  }

  _start(tween) {
    this.tweens.add(tween);
    if (!this.updating) {
      this.updating = true;
      this._update();
    }
  }

  _stop(tween) {
    this.tweens.delete(tween);
    if (!this.tweens.size) {
      this.updating = false;
    }
  }
}

TweenFactory.easing = {
  linear: t => t,
  smoothstep: t => t * t * (3 - 2 * t),
  smootherstep: t => t * t * t * (t * (t * 6 - 15) + 10)
};

var Surface = class {
  constructor() {
    this.geometry;
  }

  _newGeometry(vertexCount = 0, indexCount = 0) {
    this.dispose();

    this.geometry = new THREE.BufferGeometry();

    const position = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3);
    position.dynamic = true;
    this.geometry.addAttribute('position', position);

    const normal = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3);
    normal.dynamic = true;
    this.geometry.addAttribute('normal', normal);

    this.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indexCount), 1));
  }

  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
  }

  generate() {
    // override in child class
  }
};

const EPS = 0.00001;

var ParametricSurface = class extends Surface {
  constructor() {
    super();
    this._morphPositions;
    this._morphNormals;
    this._lastResolution;
  }

  _newGeometry(resolution) {
    const tileResolution = resolution - 1;

    super._newGeometry(resolution * resolution, 6 * tileResolution * tileResolution);

    const indices = this.geometry.getIndex().array;

    for (let i = 0; i < tileResolution; i++) {
      for (let j = 0; j < tileResolution; j++) {
        const topL = resolution * i + j;
        const topR = resolution * i + j + 1;
        const botL = resolution * (i + 1) + j;
        const botR = resolution * (i + 1) + j + 1;
        const start = 6 * (tileResolution * i + j);
        if (i % 2 === j % 2) {
          indices[start] = topL;
          indices[start + 1] = botR;
          indices[start + 2] = botL;
          indices[start + 3] = topL;
          indices[start + 4] = topR;
          indices[start + 5] = botR;
        }
        else {
          indices[start] = topL;
          indices[start + 1] = topR;
          indices[start + 2] = botL;
          indices[start + 3] = topR;
          indices[start + 4] = botR;
          indices[start + 5] = botL;
        }
      }
    }
  }

  _computeSurface(definition, resolution) {
    const {fx, fy, fz, u0, u1, v0, v1} = definition;

    const positions =  this.geometry.getAttribute('position');
    const normals =  this.geometry.getAttribute('normal');

    const tempv = new THREE.Vector3();
    const f = new THREE.Vector3();
    const ru = new THREE.Vector3();
    const rv = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let i = 0; i < resolution; i++) {

      const vd = i / (resolution - 1);

      for (let j = 0; j < resolution; j++) {
        const ud = j / (resolution - 1);

        const u = u0 + ud * (u1 - u0);
        const v = v0 + vd * (v1 - v0);

        f.set(fx(u, v), fy(u, v), fz(u, v));

        // approximate tangent vectors via finite differences
        let offset = u - EPS;
        if (offset >= u0) {
          ru.subVectors(f, tempv.set(fx(offset, v), fy(offset, v), fz(offset, v)));
        }
        else {
          offset = u + EPS;
          ru.subVectors(tempv.set(fx(offset, v), fy(offset, v), fz(offset, v)), f);
        }

        offset = v - EPS;
        if (offset >= v0) {
          rv.subVectors(f, tempv.set(fx(u, offset), fy(u, offset), fz(u, offset)));
        }
        else {
          offset = v + EPS;
          rv.subVectors(tempv.set(fx(u, offset), fy(u, offset), fz(u, offset)), f);
        }

        // cross product of tangent vectors gives surface normal
        normal.crossVectors(ru, rv).normalize();

        const index = resolution * i + j;
        positions.setXYZ(index, f.x, f.y, f.z);
        normals.setXYZ(index, normal.x, normal.y, normal.z);
      }
    }

    positions.needsUpdate = true;
    normals.needsUpdate = true;
  }

  generate(definition, resolution) {
    super.generate();

    let animatable;

    if (this._lastResolution !== resolution) {
      this._newGeometry(resolution);

      this._morphPositions = this.geometry.getAttribute('position').clone();
      this._morphNormals = this.geometry.getAttribute('normal').clone();

      animatable = false;
    }
    else {
      const positions = this.geometry.getAttribute('position');
      const normals = this.geometry.getAttribute('normal');

      this.geometry.addAttribute('position', this._morphPositions);
      this.geometry.addAttribute('normal', this._morphNormals);

      this._morphPositions = positions;
      this._morphNormals = normals;

      this.geometry.morphAttributes.position = [this._morphPositions];
      this.geometry.morphAttributes.normal = [this._morphNormals];

      animatable = true;
    }

    this._computeSurface(definition, resolution);
    this._lastResolution = resolution;

    return {
      animatable
    };
  }
};

const EPS$1 = 0.0001;

// Marching Cubes algorithm with edge table provided by Paul Bourke

var Polygonizer = class {
  constructor(pushVertex, pushTriangle, resolution) {
    this.pushVertex = pushVertex;
    this.pushTriangle = pushTriangle;
    this.center = {x: 0, y: 0, z: 0};
    this.radius = 1;

    this._resolution = resolution;

    this._values = [];
    for (let i = 0; i <= resolution; i++) {
      this._values[i] = [];
      for (let j = 0; j <= resolution; j++) {
        this._values[i][j] = [];
        for (let k = 0; k <= resolution; k++) {
          this._values[i][j][k] = {
            position: {x: 0, y: 0, z: 0},
            value: 0,
            edgeX: {index: -1},
            edgeY: {index: -1},
            edgeZ: {index: -1}
          };
        }
      }
    }

    this._edgeTable = [0x0,0x109,0x203,0x30a,0x406,0x50f,0x605,0x70c,0x80c,0x905,0xa0f,0xb06,0xc0a,0xd03,0xe09,0xf00,0x190,0x99,0x393,0x29a,0x596,0x49f,0x795,0x69c,0x99c,0x895,0xb9f,0xa96,0xd9a,0xc93,0xf99,0xe90,0x230,0x339,0x33,0x13a,0x636,0x73f,0x435,0x53c,0xa3c,0xb35,0x83f,0x936,0xe3a,0xf33,0xc39,0xd30,0x3a0,0x2a9,0x1a3,0xaa,0x7a6,0x6af,0x5a5,0x4ac,0xbac,0xaa5,0x9af,0x8a6,0xfaa,0xea3,0xda9,0xca0,0x460,0x569,0x663,0x76a,0x66,0x16f,0x265,0x36c,0xc6c,0xd65,0xe6f,0xf66,0x86a,0x963,0xa69,0xb60,0x5f0,0x4f9,0x7f3,0x6fa,0x1f6,0xff,0x3f5,0x2fc,0xdfc,0xcf5,0xfff,0xef6,0x9fa,0x8f3,0xbf9,0xaf0,0x650,0x759,0x453,0x55a,0x256,0x35f,0x55,0x15c,0xe5c,0xf55,0xc5f,0xd56,0xa5a,0xb53,0x859,0x950,0x7c0,0x6c9,0x5c3,0x4ca,0x3c6,0x2cf,0x1c5,0xcc,0xfcc,0xec5,0xdcf,0xcc6,0xbca,0xac3,0x9c9,0x8c0,0x8c0,0x9c9,0xac3,0xbca,0xcc6,0xdcf,0xec5,0xfcc,0xcc,0x1c5,0x2cf,0x3c6,0x4ca,0x5c3,0x6c9,0x7c0,0x950,0x859,0xb53,0xa5a,0xd56,0xc5f,0xf55,0xe5c,0x15c,0x55,0x35f,0x256,0x55a,0x453,0x759,0x650,0xaf0,0xbf9,0x8f3,0x9fa,0xef6,0xfff,0xcf5,0xdfc,0x2fc,0x3f5,0xff,0x1f6,0x6fa,0x7f3,0x4f9,0x5f0,0xb60,0xa69,0x963,0x86a,0xf66,0xe6f,0xd65,0xc6c,0x36c,0x265,0x16f,0x66,0x76a,0x663,0x569,0x460,0xca0,0xda9,0xea3,0xfaa,0x8a6,0x9af,0xaa5,0xbac,0x4ac,0x5a5,0x6af,0x7a6,0xaa,0x1a3,0x2a9,0x3a0,0xd30,0xc39,0xf33,0xe3a,0x936,0x83f,0xb35,0xa3c,0x53c,0x435,0x73f,0x636,0x13a,0x33,0x339,0x230,0xe90,0xf99,0xc93,0xd9a,0xa96,0xb9f,0x895,0x99c,0x69c,0x795,0x49f,0x596,0x29a,0x393,0x99,0x190,0xf00,0xe09,0xd03,0xc0a,0xb06,0xa0f,0x905,0x80c,0x70c,0x605,0x50f,0x406,0x30a,0x203,0x109,0x0];
    this._triTable = [[],[0,8,3],[0,1,9],[1,8,3,9,8,1],[1,2,10],[0,8,3,1,2,10],[9,2,10,0,2,9],[2,8,3,2,10,8,10,9,8],[3,11,2],[0,11,2,8,11,0],[1,9,0,2,3,11],[1,11,2,1,9,11,9,8,11],[3,10,1,11,10,3],[0,10,1,0,8,10,8,11,10],[3,9,0,3,11,9,11,10,9],[9,8,10,10,8,11],[4,7,8],[4,3,0,7,3,4],[0,1,9,8,4,7],[4,1,9,4,7,1,7,3,1],[1,2,10,8,4,7],[3,4,7,3,0,4,1,2,10],[9,2,10,9,0,2,8,4,7],[2,10,9,2,9,7,2,7,3,7,9,4],[8,4,7,3,11,2],[11,4,7,11,2,4,2,0,4],[9,0,1,8,4,7,2,3,11],[4,7,11,9,4,11,9,11,2,9,2,1],[3,10,1,3,11,10,7,8,4],[1,11,10,1,4,11,1,0,4,7,11,4],[4,7,8,9,0,11,9,11,10,11,0,3],[4,7,11,4,11,9,9,11,10],[9,5,4],[9,5,4,0,8,3],[0,5,4,1,5,0],[8,5,4,8,3,5,3,1,5],[1,2,10,9,5,4],[3,0,8,1,2,10,4,9,5],[5,2,10,5,4,2,4,0,2],[2,10,5,3,2,5,3,5,4,3,4,8],[9,5,4,2,3,11],[0,11,2,0,8,11,4,9,5],[0,5,4,0,1,5,2,3,11],[2,1,5,2,5,8,2,8,11,4,8,5],[10,3,11,10,1,3,9,5,4],[4,9,5,0,8,1,8,10,1,8,11,10],[5,4,0,5,0,11,5,11,10,11,0,3],[5,4,8,5,8,10,10,8,11],[9,7,8,5,7,9],[9,3,0,9,5,3,5,7,3],[0,7,8,0,1,7,1,5,7],[1,5,3,3,5,7],[9,7,8,9,5,7,10,1,2],[10,1,2,9,5,0,5,3,0,5,7,3],[8,0,2,8,2,5,8,5,7,10,5,2],[2,10,5,2,5,3,3,5,7],[7,9,5,7,8,9,3,11,2],[9,5,7,9,7,2,9,2,0,2,7,11],[2,3,11,0,1,8,1,7,8,1,5,7],[11,2,1,11,1,7,7,1,5],[9,5,8,8,5,7,10,1,3,10,3,11],[5,7,0,5,0,9,7,11,0,1,0,10,11,10,0],[11,10,0,11,0,3,10,5,0,8,0,7,5,7,0],[11,10,5,7,11,5],[10,6,5],[0,8,3,5,10,6],[9,0,1,5,10,6],[1,8,3,1,9,8,5,10,6],[1,6,5,2,6,1],[1,6,5,1,2,6,3,0,8],[9,6,5,9,0,6,0,2,6],[5,9,8,5,8,2,5,2,6,3,2,8],[2,3,11,10,6,5],[11,0,8,11,2,0,10,6,5],[0,1,9,2,3,11,5,10,6],[5,10,6,1,9,2,9,11,2,9,8,11],[6,3,11,6,5,3,5,1,3],[0,8,11,0,11,5,0,5,1,5,11,6],[3,11,6,0,3,6,0,6,5,0,5,9],[6,5,9,6,9,11,11,9,8],[5,10,6,4,7,8],[4,3,0,4,7,3,6,5,10],[1,9,0,5,10,6,8,4,7],[10,6,5,1,9,7,1,7,3,7,9,4],[6,1,2,6,5,1,4,7,8],[1,2,5,5,2,6,3,0,4,3,4,7],[8,4,7,9,0,5,0,6,5,0,2,6],[7,3,9,7,9,4,3,2,9,5,9,6,2,6,9],[3,11,2,7,8,4,10,6,5],[5,10,6,4,7,2,4,2,0,2,7,11],[0,1,9,4,7,8,2,3,11,5,10,6],[9,2,1,9,11,2,9,4,11,7,11,4,5,10,6],[8,4,7,3,11,5,3,5,1,5,11,6],[5,1,11,5,11,6,1,0,11,7,11,4,0,4,11],[0,5,9,0,6,5,0,3,6,11,6,3,8,4,7],[6,5,9,6,9,11,4,7,9,7,11,9],[10,4,9,6,4,10],[4,10,6,4,9,10,0,8,3],[10,0,1,10,6,0,6,4,0],[8,3,1,8,1,6,8,6,4,6,1,10],[1,4,9,1,2,4,2,6,4],[3,0,8,1,2,9,2,4,9,2,6,4],[0,2,4,4,2,6],[8,3,2,8,2,4,4,2,6],[10,4,9,10,6,4,11,2,3],[0,8,2,2,8,11,4,9,10,4,10,6],[3,11,2,0,1,6,0,6,4,6,1,10],[6,4,1,6,1,10,4,8,1,2,1,11,8,11,1],[9,6,4,9,3,6,9,1,3,11,6,3],[8,11,1,8,1,0,11,6,1,9,1,4,6,4,1],[3,11,6,3,6,0,0,6,4],[6,4,8,11,6,8],[7,10,6,7,8,10,8,9,10],[0,7,3,0,10,7,0,9,10,6,7,10],[10,6,7,1,10,7,1,7,8,1,8,0],[10,6,7,10,7,1,1,7,3],[1,2,6,1,6,8,1,8,9,8,6,7],[2,6,9,2,9,1,6,7,9,0,9,3,7,3,9],[7,8,0,7,0,6,6,0,2],[7,3,2,6,7,2],[2,3,11,10,6,8,10,8,9,8,6,7],[2,0,7,2,7,11,0,9,7,6,7,10,9,10,7],[1,8,0,1,7,8,1,10,7,6,7,10,2,3,11],[11,2,1,11,1,7,10,6,1,6,7,1],[8,9,6,8,6,7,9,1,6,11,6,3,1,3,6],[0,9,1,11,6,7],[7,8,0,7,0,6,3,11,0,11,6,0],[7,11,6],[7,6,11],[3,0,8,11,7,6],[0,1,9,11,7,6],[8,1,9,8,3,1,11,7,6],[10,1,2,6,11,7],[1,2,10,3,0,8,6,11,7],[2,9,0,2,10,9,6,11,7],[6,11,7,2,10,3,10,8,3,10,9,8],[7,2,3,6,2,7],[7,0,8,7,6,0,6,2,0],[2,7,6,2,3,7,0,1,9],[1,6,2,1,8,6,1,9,8,8,7,6],[10,7,6,10,1,7,1,3,7],[10,7,6,1,7,10,1,8,7,1,0,8],[0,3,7,0,7,10,0,10,9,6,10,7],[7,6,10,7,10,8,8,10,9],[6,8,4,11,8,6],[3,6,11,3,0,6,0,4,6],[8,6,11,8,4,6,9,0,1],[9,4,6,9,6,3,9,3,1,11,3,6],[6,8,4,6,11,8,2,10,1],[1,2,10,3,0,11,0,6,11,0,4,6],[4,11,8,4,6,11,0,2,9,2,10,9],[10,9,3,10,3,2,9,4,3,11,3,6,4,6,3],[8,2,3,8,4,2,4,6,2],[0,4,2,4,6,2],[1,9,0,2,3,4,2,4,6,4,3,8],[1,9,4,1,4,2,2,4,6],[8,1,3,8,6,1,8,4,6,6,10,1],[10,1,0,10,0,6,6,0,4],[4,6,3,4,3,8,6,10,3,0,3,9,10,9,3],[10,9,4,6,10,4],[4,9,5,7,6,11],[0,8,3,4,9,5,11,7,6],[5,0,1,5,4,0,7,6,11],[11,7,6,8,3,4,3,5,4,3,1,5],[9,5,4,10,1,2,7,6,11],[6,11,7,1,2,10,0,8,3,4,9,5],[7,6,11,5,4,10,4,2,10,4,0,2],[3,4,8,3,5,4,3,2,5,10,5,2,11,7,6],[7,2,3,7,6,2,5,4,9],[9,5,4,0,8,6,0,6,2,6,8,7],[3,6,2,3,7,6,1,5,0,5,4,0],[6,2,8,6,8,7,2,1,8,4,8,5,1,5,8],[9,5,4,10,1,6,1,7,6,1,3,7],[1,6,10,1,7,6,1,0,7,8,7,0,9,5,4],[4,0,10,4,10,5,0,3,10,6,10,7,3,7,10],[7,6,10,7,10,8,5,4,10,4,8,10],[6,9,5,6,11,9,11,8,9],[3,6,11,0,6,3,0,5,6,0,9,5],[0,11,8,0,5,11,0,1,5,5,6,11],[6,11,3,6,3,5,5,3,1],[1,2,10,9,5,11,9,11,8,11,5,6],[0,11,3,0,6,11,0,9,6,5,6,9,1,2,10],[11,8,5,11,5,6,8,0,5,10,5,2,0,2,5],[6,11,3,6,3,5,2,10,3,10,5,3],[5,8,9,5,2,8,5,6,2,3,8,2],[9,5,6,9,6,0,0,6,2],[1,5,8,1,8,0,5,6,8,3,8,2,6,2,8],[1,5,6,2,1,6],[1,3,6,1,6,10,3,8,6,5,6,9,8,9,6],[10,1,0,10,0,6,9,5,0,5,6,0],[0,3,8,5,6,10],[10,5,6],[11,5,10,7,5,11],[11,5,10,11,7,5,8,3,0],[5,11,7,5,10,11,1,9,0],[10,7,5,10,11,7,9,8,1,8,3,1],[11,1,2,11,7,1,7,5,1],[0,8,3,1,2,7,1,7,5,7,2,11],[9,7,5,9,2,7,9,0,2,2,11,7],[7,5,2,7,2,11,5,9,2,3,2,8,9,8,2],[2,5,10,2,3,5,3,7,5],[8,2,0,8,5,2,8,7,5,10,2,5],[9,0,1,5,10,3,5,3,7,3,10,2],[9,8,2,9,2,1,8,7,2,10,2,5,7,5,2],[1,3,5,3,7,5],[0,8,7,0,7,1,1,7,5],[9,0,3,9,3,5,5,3,7],[9,8,7,5,9,7],[5,8,4,5,10,8,10,11,8],[5,0,4,5,11,0,5,10,11,11,3,0],[0,1,9,8,4,10,8,10,11,10,4,5],[10,11,4,10,4,5,11,3,4,9,4,1,3,1,4],[2,5,1,2,8,5,2,11,8,4,5,8],[0,4,11,0,11,3,4,5,11,2,11,1,5,1,11],[0,2,5,0,5,9,2,11,5,4,5,8,11,8,5],[9,4,5,2,11,3],[2,5,10,3,5,2,3,4,5,3,8,4],[5,10,2,5,2,4,4,2,0],[3,10,2,3,5,10,3,8,5,4,5,8,0,1,9],[5,10,2,5,2,4,1,9,2,9,4,2],[8,4,5,8,5,3,3,5,1],[0,4,5,1,0,5],[8,4,5,8,5,3,9,0,5,0,3,5],[9,4,5],[4,11,7,4,9,11,9,10,11],[0,8,3,4,9,7,9,11,7,9,10,11],[1,10,11,1,11,4,1,4,0,7,4,11],[3,1,4,3,4,8,1,10,4,7,4,11,10,11,4],[4,11,7,9,11,4,9,2,11,9,1,2],[9,7,4,9,11,7,9,1,11,2,11,1,0,8,3],[11,7,4,11,4,2,2,4,0],[11,7,4,11,4,2,8,3,4,3,2,4],[2,9,10,2,7,9,2,3,7,7,4,9],[9,10,7,9,7,4,10,2,7,8,7,0,2,0,7],[3,7,10,3,10,2,7,4,10,1,10,0,4,0,10],[1,10,2,8,7,4],[4,9,1,4,1,7,7,1,3],[4,9,1,4,1,7,0,8,1,8,7,1],[4,0,3,7,4,3],[4,8,7],[9,10,8,10,11,8],[3,0,9,3,9,11,11,9,10],[0,1,10,0,10,8,8,10,11],[3,1,10,11,3,10],[1,2,11,1,11,9,9,11,8],[3,0,9,3,9,11,1,2,9,2,11,9],[0,2,11,8,0,11],[3,2,11],[2,3,8,2,8,10,10,8,9],[9,10,2,0,9,2],[2,3,8,2,8,10,0,1,8,1,10,8],[1,10,2],[1,3,8,9,1,8],[0,9,1],[0,3,8],[]];
  }

  _normal(eq, p) {
    const fp = eq(p.x, p.y, p.z);
    const x = (eq(p.x + EPS$1, p.y, p.z) - fp) / EPS$1;
    const y = (eq(p.x, p.y + EPS$1, p.z) - fp) / EPS$1;
    const z = (eq(p.x, p.y, p.z + EPS$1) - fp) / EPS$1;
    const l = Math.sqrt(x * x + y * y + z * z);
    return {
      x: x / l,
      y: y / l,
      z: z / l
    };
  }

  _surfacePoint(eq, v0, v1) {
    // linear interpolation

    const mu = -v0.value / (v1.value - v0.value);

    return {
      x: v0.position.x + mu * (v1.position.x - v0.position.x),
      y: v0.position.y + mu * (v1.position.y - v0.position.y),
      z: v0.position.z + mu * (v1.position.z - v0.position.z)
    };
  }

  _lookupEdge(equation, edge, v0, v1) {
    if (edge.index === -1) {
      const p = this._surfacePoint(equation, v0, v1);
      edge.index = this.pushVertex(p, this._normal(equation, p));
    }

    return edge.index;
  }

  triangulate(equation) {

    for (let i = 0; i <= this._resolution; i++) {
      const x = this.radius * (2 * i / this._resolution - 1) + this.center.x;
      for (let j = 0; j <= this._resolution; j++) {
        const y = this.radius * (2 * j / this._resolution - 1) + this.center.y;
        for (let k = 0; k <= this._resolution; k++) {
          const z = this.radius * (2 * k / this._resolution - 1) + this.center.z;
          const v = this._values[i][j][k];
          v.position.x = x;
          v.position.y = y;
          v.position.z = z;
          v.value = equation(x, y, z);
          v.edgeX.index = -1;
          v.edgeY.index = -1;
          v.edgeZ.index = -1;
        }
      }
    }

    const vertList = [];

    for (let i = 0; i < this._resolution; i++) {
      for (let j = 0; j < this._resolution; j++) {
        for (let k = 0; k < this._resolution; k++) {
          const v0 = this._values[i][j + 1][k];
          const v1 = this._values[i + 1][j + 1][k];
          const v2 = this._values[i + 1][j][k];
          const v3 = this._values[i][j][k];
          const v4 = this._values[i][j + 1][k + 1];
          const v5 = this._values[i + 1][j + 1][k + 1];
          const v6 = this._values[i + 1][j][k + 1];
          const v7 = this._values[i][j][k + 1];

          let cubeIndex = 0;

          if (v0.value < 0) cubeIndex |= 1;
          if (v1.value < 0) cubeIndex |= 2;
          if (v2.value < 0) cubeIndex |= 4;
          if (v3.value < 0) cubeIndex |= 8;
          if (v4.value < 0) cubeIndex |= 16;
          if (v5.value < 0) cubeIndex |= 32;
          if (v6.value < 0) cubeIndex |= 64;
          if (v7.value < 0) cubeIndex |= 128;

          const activeEdges = this._edgeTable[cubeIndex];

          if (activeEdges & 1) vertList[0] = this._lookupEdge(equation, v0.edgeX, v0, v1);
          if (activeEdges & 2) vertList[1] = this._lookupEdge(equation, v2.edgeY, v2, v1);
          if (activeEdges & 4) vertList[2] = this._lookupEdge(equation, v3.edgeX, v3, v2);
          if (activeEdges & 8) vertList[3] = this._lookupEdge(equation, v3.edgeY, v3, v0);
          if (activeEdges & 16) vertList[4] = this._lookupEdge(equation, v4.edgeX, v4, v5);
          if (activeEdges & 32) vertList[5] = this._lookupEdge(equation, v6.edgeY, v6, v5);
          if (activeEdges & 64) vertList[6] = this._lookupEdge(equation, v7.edgeX, v7, v6);
          if (activeEdges & 128) vertList[7] = this._lookupEdge(equation, v7.edgeY, v7, v4);
          if (activeEdges & 256) vertList[8] = this._lookupEdge(equation, v0.edgeZ, v0, v4);
          if (activeEdges & 512) vertList[9] = this._lookupEdge(equation, v1.edgeZ, v1, v5);
          if (activeEdges & 1024) vertList[10] = this._lookupEdge(equation, v2.edgeZ, v2, v6);
          if (activeEdges & 2048) vertList[11] = this._lookupEdge(equation, v3.edgeZ, v3, v7);

          const tri = this._triTable[cubeIndex];

          for (let i = 0; i < tri.length; i += 3) {
            const vert0 = vertList[tri[i]];
            const vert1 = vertList[tri[i + 1]];
            const vert2 = vertList[tri[i + 2]];
            this.pushTriangle(vert0, vert1, vert2);
          }
        }
      }
    }
  }
};

var ImplicitSurface = class extends Surface {
  constructor() {
    super();
    this._vertexIndex = 0;
    this._triangleIndex = 0;
    this._lastResolution;
  }

  _newGeometry(resolution) {
    const r2 = resolution * resolution;

    // empirically estimated buffer sizes
    super._newGeometry(40 * r2, 200 * r2);

    const positions = this.geometry.getAttribute('position');
    const normals = this.geometry.getAttribute('normal');

    const pushVertex = (position, normal) => {
      positions.setXYZ(this._vertexIndex, position.x, position.y, position.z);
      normals.setXYZ(this._vertexIndex, normal.x, normal.y, normal.z);

      return this._vertexIndex++;
    };

    const indices = this.geometry.getIndex().array;

    const pushTriangle = (v1, v2, v3) => {
      indices[this._triangleIndex++] = v1;
      indices[this._triangleIndex++] = v2;
      indices[this._triangleIndex++] = v3;
    };

    this._polygonizer = new Polygonizer(pushVertex, pushTriangle, resolution);
  }

  generate(equation, center, radius, resolution) {
    super.generate();

    if (resolution !== this._lastResolution) {
      this._newGeometry(resolution);
    }

    this._vertexIndex = 0;
    this._triangleIndex = 0;

    this._polygonizer.center = center;
    this._polygonizer.radius = 0.7 * radius;
    this._polygonizer.triangulate(equation);

    if (this._vertexIndex) {
      this.geometry.getAttribute('position').needsUpdate = true;
      this.geometry.getAttribute('position').updateRange.count = 3 * this._vertexIndex;

      this.geometry.getAttribute('normal').needsUpdate = true;
      this.geometry.getAttribute('position').updateRange.count = 3 * this._vertexIndex;
    }

    this.geometry.getIndex().needsUpdate = true;
    this.geometry.setDrawRange(0, this._triangleIndex);

    this._lastResolution = resolution;
  }
};

class OscillatingEquation {
  constructor(equation, amplitude, frequency) {
    this._oscillationConstant = 0;
    this.amplitude = amplitude;
    this.frequency = frequency;
    this._startTime = Date.now();
    this.equation = (x, y, z) => equation(x, y, z) + this._oscillationConstant;
  }

  update(time) {
    this._oscillationConstant = this.amplitude * Math.sin(this.frequency * (time - this._startTime));
  }
}

class MorphingEquation {
  constructor(fromEquation, toEquation) {
    this.time = 0;
    this.equation = (x, y, z) => (1 - this.time) * fromEquation(x, y, z) + this.time * toEquation(x, y, z);
  }
}

var ImplicitSurfaceAnimator = class {
  constructor() {
    this.equation = (x, y, z) => x*x + y*y + z*z - 1;
    this._tweens = new TweenFactory();

    this._tweens.onUpdate(() => {
      if (this.onUpdate) {
        this.onUpdate();
      }
    });

    this._oscillatingEquation = null;
    this._oscillationLoopId = null;
    this._oscillationLoop = () => {
      this._oscillatingEquation.update(Date.now());
      if (this.onUpdate) {
        this.onUpdate();
      }
      this._oscillationLoopId = requestAnimationFrame(this._oscillationLoop);
    };
  }

  morph(equation, duration, oscillate) {
    cancelAnimationFrame(this._oscillationLoopId);
    const previouslyOscillatingEquation = this._oscillatingEquation;

    if (oscillate) {
      this._oscillatingEquation = new OscillatingEquation(equation, oscillate.amplitude, oscillate.frequency);
      equation = this._oscillatingEquation.equation;
    }
    else {
      this._oscillatingEquation = null;
    }

    if (!duration) {
      this._tweens.stopAll();
      this.equation = equation;

      if (this._oscillatingEquation) {
        this._oscillationLoop();
      }
      else if (this.onUpdate) {
        this.onUpdate();
      }

      return;
    }

    const morphingEquation = new MorphingEquation(this.equation, equation);
    this.equation = morphingEquation.equation;

    for (let tween of this._tweens.tweens) {
      tween.onComplete(null);
    }

    if (previouslyOscillatingEquation) {
      this._tweens.create()
        .duration(duration)
        .easing(TweenFactory.easing.linear)
        .onUpdate(() => {
          previouslyOscillatingEquation.update(Date.now());
        })
        .start();
    }

    const tween = this._tweens.create(morphingEquation)
      .to({time: 1})
      .duration(duration)
      .onComplete(() => {
        this.equation = equation;
        if (this._oscillatingEquation) {
          this._oscillationLoop();
        }
      });

    if (this._oscillatingEquation) {
      const oscEq = this._oscillatingEquation;
      tween.onUpdate(() => {
        oscEq.update(Date.now());
      });
    }

    tween.start();
  }

  stop() {
    this._tweens.stopAll();
    cancelAnimationFrame(this._oscillationLoopId);
  }
};

var vertexShader = `
#define PHYSICAL

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
// #include <uv_pars_vertex>
// #include <uv2_pars_vertex>
// #include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

varying vec3 vObjectNormal;
varying vec3 vObjectPos;

void main() {

	// #include <uv_vertex>
	// #include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );
	vObjectNormal = normalize( objectNormal );

#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	// #include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

	vObjectPos = transformed;

}
`;

var fragmentShader = `
#define PHYSICAL

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifndef STANDARD
	uniform float clearCoat;
	uniform float clearCoatRoughness;
#endif

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
// #include <uv_pars_fragment>
// #include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <lights_pars>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
// #include <normalmap_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform float uvScale;

varying vec3 vObjectPos;
varying vec3 vObjectNormal;

vec4 triplanarBlending( vec2 xPlane, vec2 yPlane, vec2 zPlane, vec3 weights, sampler2D texture ) {

	vec4 xTexel = texture2D( texture, xPlane );
	vec4 yTexel = texture2D( texture, yPlane );
	vec4 zTexel = texture2D( texture, zPlane );

	return xTexel * weights.x + yTexel * weights.y + zTexel * weights.z;

}

#if defined(USE_PARALLAXMAP) || defined(USE_NORMALMAP)

	// http://www.thetenthplanet.de/archives/1180
	mat3 cotangentFrame( vec3 N, vec3 dpdyperp, vec3 dpdxperp, vec2 duvdx, vec2 duvdy ) {

		// solve the linear system
		vec3 T = dpdyperp * duvdx.x + dpdxperp * duvdy.x;
		vec3 B = dpdyperp * duvdx.y + dpdxperp * duvdy.y;

		// construct a scale invariant frame
		float l = max( dot(T, T), dot(B, B) );
		if (l == 0.) {

			return mat3(1, 0, 0, 0, 1, 0, 0, 0, 1);

		}
		else {

			float invmax = inversesqrt( l );
			return mat3( T * invmax, B * invmax, N);

		}

	}

#endif

#ifdef USE_NORMALMAP

	uniform sampler2D normalMap;
	uniform vec2 normalScale;

	vec3 perturbNormal2Arb( mat3 TBN, vec2 uv ) {

		vec3 mapN = texture2D( normalMap, uv ).xyz * 2.0 - 1.0;
		mapN.xy = normalScale * mapN.xy;
		return normalize( TBN * mapN );

	}

#endif

#ifdef USE_PARALLAXMAP

	uniform sampler2D parallaxMap;
	uniform float parallaxScale;

	vec2 perturbUv( vec3 V, int numSamples, float scale, vec2 uv ) {

		float stepSize = 1. / float(numSamples);
		vec2 offsetDir = -scale * parallaxScale * V.xy * stepSize / V.z;

		float currRayHeight = 1.;
		float lastSampledHeight = 1.;
		float currSampledHeight = 1.;

		for ( int i = 0; i < 512; i++ ) {

			if ( i >= numSamples ) {
				break;
			}

			currSampledHeight = texture2D( parallaxMap, uv ).r;

			if ( currSampledHeight > currRayHeight ) {

				float delta1 = currSampledHeight - currRayHeight;
				float delta2 = currRayHeight + stepSize - lastSampledHeight;
				float ratio = delta1 / ( delta1 + delta2 );
				vec2 lastUv = uv - offsetDir;
				uv = ratio * lastUv + ( 1. - ratio ) * uv;

				break;

			}

			currRayHeight -= stepSize;
			uv += offsetDir;
			lastSampledHeight = currSampledHeight;

		}

		return uv;

	}

#endif

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>

	float flipNormal = float( gl_FrontFacing ) * 2.0 - 1.0;
	vec3 normal = flipNormal * normalize( vNormal );

	vec3 blendWeights = abs( vObjectNormal );
	blendWeights = pow( blendWeights, vec3( 2 ) );
	blendWeights /= blendWeights.x + blendWeights.y + blendWeights.z;

	vec3 orientation = flipNormal * sign( vObjectNormal );

	vec2 xPlane = uvScale * vec2( -orientation.x * vObjectPos.z, vObjectPos.y );
	vec2 yPlane = uvScale * vec2( vObjectPos.x, -orientation.y * vObjectPos.z );
	vec2 zPlane = uvScale * vec2( orientation.z * vObjectPos.x, vObjectPos.y );

	#if defined(USE_PARALLAXMAP) || defined(USE_NORMALMAP)

		vec3 dpdx = dFdx( -vViewPosition );
		vec3 dpdy = dFdy( -vViewPosition );

		vec2 xduvdx = dFdx( xPlane );
		vec2 xduvdy = dFdy( xPlane );

		vec2 yduvdx = dFdx( yPlane );
		vec2 yduvdy = dFdy( yPlane );

		vec2 zduvdx = dFdx( zPlane );
		vec2 zduvdy = dFdy( zPlane );

		vec3 dpdyperp = cross( dpdy, normal );
		vec3 dpdxperp = cross( normal, dpdx );

		mat3 xTBN = cotangentFrame( normal, dpdyperp, dpdxperp, xduvdx, xduvdy );
		mat3 yTBN = cotangentFrame( normal, dpdyperp, dpdxperp, yduvdx, yduvdy );
		mat3 zTBN = cotangentFrame( normal, dpdyperp, dpdxperp, zduvdx, zduvdy );

	#endif

	#ifdef USE_PARALLAXMAP

		vec3 viewDir = normalize( vViewPosition );
		vec3 parallaxWeights = blendWeights / max( blendWeights.x, max( blendWeights.y, blendWeights.z ) );
		ivec3 numSamples = ivec3(mix( 50., 10., clamp( dot( viewDir, normal ), 0., 1. ) ) * parallaxWeights);

		xPlane = perturbUv( transpose( xTBN ) * viewDir, numSamples.x, parallaxWeights.x, xPlane );
		yPlane = perturbUv( transpose( yTBN ) * viewDir, numSamples.y, parallaxWeights.y, yPlane );
		zPlane = perturbUv( transpose( zTBN ) * viewDir, numSamples.z, parallaxWeights.z, zPlane );

	#endif

	#if defined USE_AOMAP
		vec4 texelPbr = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, aoMap );
	#elif defined USE_ROUGHNESSMAP
		vec4 texelPbr = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, roughnessMap );
	#elif defined USE_METALNESSMAP
		vec4 texelPbr = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, metalnessMap );
	#endif

	// #include <map_fragment>
	#ifdef USE_MAP

		vec4 texelColor = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, map );

		texelColor = mapTexelToLinear( texelColor );
		diffuseColor *= texelColor;

	#endif
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	// #include <roughnessmap_fragment>
	float roughnessFactor = roughness;

	#ifdef USE_ROUGHNESSMAP

		// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
		roughnessFactor *= texelPbr.g;

	#endif
	// #include <metalnessmap_fragment>
	float metalnessFactor = metalness;

	#ifdef USE_METALNESSMAP

		// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
		metalnessFactor *= texelPbr.b;

	#endif
	// #include <normal_fragment>
	#ifdef USE_NORMALMAP

		vec3 xNormal = perturbNormal2Arb( xTBN, xPlane );
		vec3 yNormal = perturbNormal2Arb( yTBN, yPlane );
		vec3 zNormal = perturbNormal2Arb( zTBN, zPlane );

		normal = normalize( xNormal * blendWeights.x + yNormal * blendWeights.y + zNormal * blendWeights.z );

	#endif
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_template>

	// modulation
	// #include <aomap_fragment>
	#ifdef USE_AOMAP

		// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
		float ambientOcclusion = ( texelPbr.r - 1.0 ) * aoMapIntensity + 1.0;

		reflectedLight.indirectDiffuse *= ambientOcclusion;

		#if defined( USE_ENVMAP ) && defined( PHYSICAL )

			float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );

			reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );

		#endif

	#endif

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;

// extends MeshPhysicalMaterial with triplanar mapping and parallax mapping

class SurfaceMaterial extends THREE.ShaderMaterial {
  constructor(parameters) {
    super(parameters);

    this.lights = true;
    this.extensions.derivatives = true;

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;

    const ul = THREE.UniformsLib;

    this.uniforms = THREE.UniformsUtils.merge([
      ul.common,
      ul.envmap,
      ul.aomap,
      // ul.lightmap,
      // ul.emissivemap,
      // ul.bumpmap,
      ul.normalmap,
      // ul.displacementmap,
      ul.roughnessmap,
      ul.metalnessmap,
      // ul.fog,
      ul.lights,
      {
        emissive: { value: new THREE.Color( 0x000000 ) },
        roughness: { value: 0.5 },
        metalness: { value: 0.5 },
        envMapIntensity: { value: 1 }
      },
      {
        clearCoat: {value: 0},
        clearCoatRoughness: {value: 0}
      },
      {
        uvScale: {value: 1},
        parallaxMap: { value: null },
        parallaxScale: { value: 0.04 }
      }
    ]);
  }

  get color() {
    return this.uniforms.diffuse.value;
  }

  set color(value) {
    this.uniforms.diffuse.value.set(value);
  }

  get parallaxMap() {
    return this.uniforms.parallaxMap.value;
  }

  set parallaxMap(map) {
    this.uniforms.parallaxMap.value = map;
    this.defines.USE_PARALLAXMAP = map ? true : false;
  }
}

// Create getters/setters for MeshPhysicalMaterial's built-in properties.
// This allows the user to work with SurfaceMaterial as though it were MeshPhysicalMaterial
const materialProperties$1 = ['aoMap', 'envMap' ,'map', 'metalness', 'metalnessMap', 'normalMap', 'normalScale', 'parallaxScale', 'reflectivity', 'roughness', 'roughnessMap', 'uvScale'];
for (let p of materialProperties$1) {
  Object.defineProperty(SurfaceMaterial.prototype, p, {
    enumerable: true,
    get: function() {
      return this.uniforms[p].value;
    },
    set: function(value) {
      this.uniforms[p].value = value;
    }
  });
}

function request(url, responseType = 'json') {
  const r = new XMLHttpRequest();
  r.responseType = responseType;
  r.open('GET', url);

  const promise = new Promise((resolve, reject) => {
    r.onreadystatechange = () => {

      if (r.readyState !== XMLHttpRequest.DONE) {
        return;
      }

      THREE.DefaultLoadingManager.itemEnd(url);

      if (r.status === 200) {
        resolve(r.response);
      }
      else {
        THREE.DefaultLoadingManager.itemError(url);
        reject(r.status);
      }
    };
  });

  THREE.DefaultLoadingManager.itemStart(url);

  r.send();

  return {
    promise,
    abort: () => r.abort()
  };
}

function detachableEvents(...events) {
  const removeEvents = [];
  for (let e of events) {
    e.element.addEventListener(e.type, e.callback);
    removeEvents.push(() => {
      e.element.removeEventListener(e.type, e.callback);
    });
  }
  return () => {
    for (let remove of removeEvents) {
      remove();
    }
  };
}

function emptyNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function setAttribs(elem, attribs) {
  for (let name in attribs) {
    elem.setAttribute(name, attribs[name]);
  }
}

function createElem(name, attribs, htmlContent) {
  const elem = document.createElement(name);
  if (attribs) {
    setAttribs(elem, attribs);
  }
  if (htmlContent) {
    elem.innerHTML = htmlContent;
  }

  return elem;
}

function buildDomTree(parent, children) {
  for (let [i, child] of children.entries()) {
    if (child instanceof Array) {
      buildDomTree(children[i - 1], child);
    }
    else {
      if (!(child instanceof Node)) {
        child = document.createTextNode(child);
      }
      parent.appendChild(child);
    }
  }

  return parent;
}

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}



function limiter(fn, waitTime, immediate, debounce, timeoutFn, clearTimeoutFn) {
  let timeoutID;
  let currentArguments;

  function timeout() {
    if (currentArguments) {
      fn.apply(this, currentArguments);
      currentArguments = null;
      timeoutID = timeoutFn(timeout, waitTime);
    }
    else {
      timeoutID = null;
    }
  }

  return {
    function() {
      currentArguments = arguments;
      if (immediate && !timeoutID) {
        timeout();
      }
      else if (debounce) {
        clearTimeoutFn(timeoutID);
        timeoutID = timeoutFn(timeout, waitTime);
      }
    },

    cancel() {
      clearTimeoutFn(timeoutID);
    }
  };
}

function debounce(fn, waitTime, immediate) {
  return limiter(fn, waitTime, immediate, true, setTimeout, clearTimeout);
}



function throttleAnimationFrame(fn) {
  return limiter(fn, null, true, false, requestAnimationFrame, cancelAnimationFrame);
}

const v = new THREE.Vector3();

var OrbitControls = class {
  constructor(camera, object, domElement) {
    this.camera = camera;
    this.object = object;

    this.resetPosition();

    this.panSensitivity = 0.0005;
    this.rotateSensitivity = 0.0009;
    this.scaleSensitivity = 1.08;

    // events
    this.onUpdate;
    this.onPan;
    this.onScale;

    this._mouseAction;
    this._detachEvents = detachableEvents(
      {
        element: domElement,
        type: 'mousedown',
        callback: e => {
          domElement.requestPointerLock();
          this._mouseAction = this._mousePan;
          e.preventDefault();
        }
      },
      {
        element: window,
        type: 'mouseup',
        callback: () => {
          this._mouseAction = this._mouseRotate;
        }
      },
      {
        element: domElement,
        type: 'mousemove',
        callback: e => {
          if (document.pointerLockElement !== domElement) {
            return;
          }
          this._mouseAction(e);
          e.preventDefault();
        }
      },
      {
        element: domElement,
        type: 'wheel',
        callback: e => {
          this.scale(Math.pow(this.scaleSensitivity, Math.sign(e.deltaY)));
          e.preventDefault();
        }
      },
      {
        element: document,
        type: 'keypress',
        callback: e => {
          if (document.pointerLockElement === domElement && e.key === ' ') {
            this.resetPosition();
            e.preventDefault();
          }
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

    if (this.onRotate) {
      this.onRotate();
    }

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

  resetPosition() {
    this.center = new THREE.Vector3();
    this.radius = 3;

    if (this.onScale) {
      this.onScale();
    }
    if (this.onPan) {
      this.onPan();
    }

    this.update();
  }

  detach() {
    this._detachEvents();
  }
};

/**
 * @author mrdoob / http://mrdoob.com/
 */

// A modification of Three.js's CubeTextureLoader
// Images are pushed to the texture.images array immediately instead of when images finish loading
// This makes it possible to cancel downloading an image by setting the src property to the empty string

function CubeTextureLoader( manager ) {

  this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

}

Object.assign( CubeTextureLoader.prototype, {

  crossOrigin: 'Anonymous',

  load: function ( urls, onLoad, onProgress, onError ) {

    var texture = new THREE.CubeTexture();

    var loader = new THREE.ImageLoader( this.manager );
    loader.setCrossOrigin( this.crossOrigin );
    loader.setPath( this.path );

    var loaded = 0;

    function onImageLoad() {

      loaded ++;

      if ( loaded === 6 ) {

        texture.needsUpdate = true;

        if ( onLoad ) onLoad( texture );

      }

    }

    for ( var i = 0; i < urls.length; ++ i ) {

      texture.images[ i ] = loader.load( urls[ i ], onImageLoad, undefined, onError );

    }

    return texture;

  },

  setCrossOrigin: function ( value ) {

    this.crossOrigin = value;
    return this;

  },

  setPath: function ( value ) {

    this.path = value;
    return this;

  }

} );

var EnvironmentLoader = class {
  constructor(basePath) {
    this.basePath = basePath;
    this._abortLoading = [];
  }

  _setupLights(definition) {
    const group = new THREE.Group();

    if (definition.hemisphere) {
      const info = definition.hemisphere;
      group.add(new THREE.HemisphereLight(info.sky, info.ground, 3 * info.intensity || 3));
    }

    if (definition.directional) {
      const distance = 1;
      const nearPlane = 1;

      for (let info of definition.directional) {
        const light = new THREE.DirectionalLight(info.color || 0xffffff, 3 * info.intensity || 3);
        light.position.setFromSpherical(new THREE.Spherical(distance + nearPlane, info.lat * Math.PI, info.lon * Math.PI));
        light.updateMatrix();
        if (info.shadow === undefined || info.shadow) {
          light.castShadow = true;
          light.shadow.bias = -0.0225;
          light.shadow.mapSize.set(1024, 1024);
          light.shadow.camera.left = -distance;
          light.shadow.camera.right = distance;
          light.shadow.camera.bottom = -distance;
          light.shadow.camera.top = distance;
          light.shadow.camera.near = nearPlane;
          light.shadow.camera.far = 2 * distance + nearPlane;
          light.shadow.camera.matrixAutoUpdate = true;
        }

        group.add(light);
      }
    }

    return group;
  }

  get default() {
    return {
      lights: this._setupLights({
        hemisphere: {
          sky: 0xffffff,
          ground: 0x333333
        }
      }),
      cubemap: null
    }
  }

  load(name) {
    for (let abort of this._abortLoading) {
      abort();
    }

    const envPath = `${this.basePath}/${name}/`;

    let cubemap;

    const cubemapPromise = new Promise((resolve, reject) => {
      cubemap = new CubeTextureLoader()
        .setPath(envPath)
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'], resolve, null, reject);
    });

    const abortCubemap = () => {
      for (let image of cubemap.images) {
        if (!image.complete) {
          image.src = ''; // cancels the previous request
        }
      }
    };

    const lightsRequest = request(`${envPath}/lights.json`);

    this._abortLoading = [abortCubemap, lightsRequest.abort];

    return Promise.all([cubemapPromise, lightsRequest.promise])
      .then(([cubemap, lightsDefinition]) => {
        this._abortLoading = [];
        return {
          lights: this._setupLights(lightsDefinition),
          cubemap
        };
      });
  }
};

const mapNames = {
  albedo: 'map',
  height: 'parallaxMap',
  normal: 'normalMap',
};

const pbrNames = {
  ao: 'aoMap',
  roughness: 'roughnessMap',
  metalness: 'metalnessMap',
};

function objPropWithDefault(object, property, defaultValue) {
  return object[property] === undefined ? defaultValue : object[property];
}

var MaterialLoader = class {
  constructor(basePath, anisotropy) {
    this.basePath = basePath;
    this.anisotropy = anisotropy;
    this._abortLoading = [];
  }

  _loadTexture(path) {
    let texture;

    const promise = new Promise((resolve, reject) => {
      texture = new THREE.TextureLoader().load(path, resolve, null, reject);
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = this.anisotropy;
    texture.flipY = true;

    return {
      texture,
      promise,
      abort: () => {
        if (!texture.image.complete) {
          texture.image.src = ''; // cancels the previous request
        }
      }
    };
  }

  load(name) {
    for (let abort of this._abortLoading) {
      abort();
    }

    const matPath = `${this.basePath}/${name}`;
    const material = {};

    for (let name of Object.values(mapNames)) {
      material[name] = null;
    }
    for (let name of Object.values(pbrNames)) {
      material[name] = null;
    }

    const materialRequest = request(`${matPath}/material.json`);

    this._abortLoading = [materialRequest.abort];

    return materialRequest.promise
      .then(definition => {
        this._abortLoading = [];

        material.roughness = objPropWithDefault(definition, 'roughness', 0);
        material.metalness = objPropWithDefault(definition, 'metalness', 0);
        material.parallaxScale = 0.014 * objPropWithDefault(definition, 'height', 1);
        material.reflectivity = objPropWithDefault(definition, 'reflectivity', 0.5);

        const texturePromises = [];
        let pbrTexture;

        for (let name of definition.map) {
          let loading;

          if (pbrNames[name]) {

            if (!pbrTexture) {
              pbrTexture = this._loadTexture(`${matPath}/pbr.jpg`);
            }

            if (name === 'roughness') {
              material.roughness = 1;
            }
            if (name === 'metalness') {
              material.metalness = 1;
            }

            loading = pbrTexture;
            material[pbrNames[name]] = loading.texture;
          }
          else if (mapNames[name]) {
            loading = this._loadTexture(`${matPath}/${name}.jpg`);
            material[mapNames[name]] = loading.texture;
          }
          else {
            continue;
          }

          texturePromises.push(loading.promise);
          this._abortLoading.push(loading.abort);
        }

        return Promise.all(texturePromises);
      })
      .then(() => {
        this._abortLoading = []; // finished downloading all images
        return material;
      });
  }
};

var Tabs = class {
  constructor() {
    this.tabList = createElem('ul', {class: 'tabList'});
    this.contentContainer = createElem('div', {class: 'activeContent'});

    this._contentById = new Map();
    this.domElement = buildDomTree(
      createElem('div', {class: 'tabs'}), [
        this.tabList,
        this.contentContainer
      ]
    );
  }

  _tabClick(id) {
    return () => this.selectTab(id);
  }

  selectTab(id) {
    const {tab, content, onInit} = this._contentById.get(id);

    for (let child of this.tabList.childNodes) {
      if (child === tab) {
        child.classList.add('active');
      }
      else {
        child.classList.remove('active');
      }
    }

    emptyNode(this.contentContainer);
    this.contentContainer.appendChild(content);

    if (onInit) {
      onInit();
    }
  }

  add(id, domElement, onInit) {
    const tab = createElem('li', {class: 'tab'}, id);
    tab.addEventListener('click', this._tabClick(id));
    this.tabList.appendChild(tab);

    this._contentById.set(id, {
      tab: tab,
      content: domElement,
      onInit
    });

    if (this._contentById.size === 1) {
      this.selectTab(id);
    }
  }
};

function controlGroup() {
  return createElem('div', {class: 'controlGroup'});
}

function inputRow() {
  return createElem('div', {class: 'inputRow'});
}

function functionFromEquation(inputs, equation) {
  equation = equation.replace(/\^/g, '**'); // replace ^ with the exponentiation operator

  const eq = new Function(`
    const ${
      Object.getOwnPropertyNames(Math)
      .map(n => `${n.toLowerCase()}=Math.${n}`)
      .join(',')
    };
    const ln = Math.log;

    return (${inputs.join(',')}) => ${equation};
  `)();

  const type = typeof eq();

  if (type !== 'number' && type !== 'undefined') {
    throw TypeError;
  }

  return eq;
}

var EquationInput = class {
  constructor(name, equationInputs, onInput) {
    this.equationInputs = equationInputs;

    this.textarea = createElem('textarea', {spellcheck: false});

    this.textarea.addEventListener('input', () => {
      this._eval();
      onInput(this.function);
    });

    this.domElement = buildDomTree(
      createElem('label', {class: 'equationInput'}), [
        createElem('var', null, name),
        this.textarea
      ]
    );

    this.domElement.title = 'Constants: e, pi\nFunctions: abs(x), acos(x), acosh(x), asin(x), asinh(x), atan(x), atanh(x), atan2(y, x), ceil(x), cos(x), cosh(x), exp(x), floor(x), ln(x), pow(x, y), round(x), sign(x), sin(x), sinh(x), sqrt(x), tan(x), tanh(x)';
  }

  _eval() {
    try {
      this.function = functionFromEquation(this.equationInputs, this.value);
      this.textarea.setCustomValidity('');
    }
    catch (e) {
      this.textarea.setCustomValidity('Invalid equation');
    }
    return this.function;
  }

  set value(value) {
    this.textarea.value = value;
    this._eval();
  }

  get value() {
    return this.textarea.value;
  }
};

var NumberInput = class {
  constructor(name, onInput, {value = 0, step = 1, min='', max=''} = {}) {
    this.input = createElem('input', {type: 'number', value, step, min, max});
    this.input.addEventListener('input', onInput);

    this.domElement = buildDomTree(
      createElem('label', {class: 'numberInput'}), [
        createElem('span', null, name),
        this.input
      ]
    );
  }

  set value(x) {
    this.input.value = x;
  }

  get value() {
    return Number(this.input.value);
  }
};

var SelectInput = class {
  constructor(name, onInput) {
    this.select = createElem('select');
    this.select.addEventListener('change', onInput);

    this.domElement = buildDomTree(
      createElem('label', {class: 'selectInput'}), [
        createElem('span', null, name),
        this.select
      ]
    );
  }

  add(name, value = name) {
    if (!this.select.namedItem(name)) {
      this.select.add(createElem('option', {value, name}, name));
    }
  }

  remove(name) {
    const optionElem = this.select.namedItem(name);
    if (optionElem) {
      this.select.remove(optionElem.index);
    }
  }

  get value() {
    return this.select.value;
  }

  set value(name) {
    const optionElem = this.select.namedItem(name);
    if (optionElem) {
      this.select.selectedIndex = optionElem.index;
    }
  }
};

var parametricEquationPresets = [
  {
    name: 'Torus',
    definition: {
      fx: '(1 + 0.5 * cos(v)) * cos(u)',
      fy: '0.5 * sin(v)',
      fz: '(1 + 0.5 * cos(v)) * sin(u)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Bianchi-Pinkall Flat Torus',
    definition: {
      fx: 'cos(u + v) * cos(0.25 + 0.25 * sin(10 * v)) /  (1 - sin(u - v) * sin(0.25 + 0.25 * sin(10 * v)))',
      fy: 'sin(u + v) * cos(0.25 + 0.25 * sin(10 * v)) /  (1 - sin(u - v) * sin(0.25 + 0.25 * sin(10 * v)))',
      fz: 'cos(u - v) * sin(0.25 + 0.25 * sin(10 * v)) /  (1 - sin(u - v) * sin(0.25 + 0.25 * sin(10 * v)))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Klein Bottle',
    definition: {
      fx: '0.5 * (1.5 + cos(v / 2) * sin(u) - sin(v / 2) * sin(2 * u)) * cos(v)',
      fy: '0.5 * (1.5 + cos(v / 2) * sin(u) - sin(v / 2) * sin(2 * u)) * sin(v)',
      fz: '0.5 * (sin(v / 2) * sin(u) + cos(v / 2) * sin(2 * u))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Cross-Cap',
    definition: {
      fx: 'sin(u) * sin(2 * v) / 2',
      fy: 'sin(2 * u) * cos(v)^2',
      fz: 'cos(2 * u) * cos(v)^2',
      u0: 0, u1: 3.142,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Boy\'s Surface',
    definition: {
      fx: '(sqrt(2) * cos(v)^2 * cos(2 * u) + cos(u) * sin(2 * v)) / (2 - sqrt(2) * sin(3 * u) * sin(2 * v))',
      fy: '(sqrt(2) * cos(v)^2 * sin(2 * u) - sin(u) * sin(2 * v)) / (2 - sqrt(2) * sin(3 * u) * sin(2 * v))',
      fz: '3 * cos(v)^2 / (2 - sqrt(2) * sin(3 * u) * sin(2 * v)) - 1.5',
      u0: 0, u1: 3.142,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Steiner Surface',
    definition: {
      fx: 'sin(2 * u) * cos(v)^2',
      fy: 'sin(u) * sin(2 * v)',
      fz: 'cos(u) * sin(2 * v)',
      u0: 0, u1: 3.142,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Breather Surface',
    definition: {
      fx: '-u + (2 * (1 - 0.6^2) * cosh(0.6 * u) * sinh(0.6 * u)) / ((1 - 0.6^2) * cosh(0.6 * u)^2 + 0.6^2 * sin(sqrt(1 - 0.6^2)*v)^2) / 0.6',
      fy: '(2 * sqrt(1 - 0.6^2) * cosh(0.6 * u) * (-sqrt(1 - 0.6^2) * cos(v) * cos(sqrt(1 - 0.6^2) * v) - sin(v) * sin(sqrt(1 - 0.6^2) * v))) / ((1 - 0.6^2) * cosh(0.6 * u)^2 + 0.6^2 * sin(sqrt(1 - 0.6^2)*v)^2) / 0.6',
      fz: '(2 * sqrt(1 - 0.6^2) * cosh(0.6 * u) * (-sqrt(1 - 0.6^2) * sin(v) * cos(sqrt(1 - 0.6^2) * v) + cos(v) * sin(sqrt(1 - 0.6^2) * v))) / ((1 - 0.6^2) * cosh(0.6 * u)^2 + 0.6^2 * sin(sqrt(1 - 0.6^2)*v)^2) / 0.6',
      u0: -8, u1: 8,
      v0: -15.7, v1: 15.7
    }
  },
  {
    name: 'Kuen Surface',
    definition: {
      fx: '(2 * (cos(u) + u * sin(u)) * sin(v)) / (1 + u * u * sin(v)^2)',
      fy: '(2 * (sin(u) - u * cos(u)) * sin(v)) / (1 + u * u * sin(v)^2)',
      fz: 'log(tan(v / 2)) + 2 * cos(v) / (1 + u * u * sin(v)^2)',
      u0: -4.494, u1: 4.494,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Snail shell',
    definition: {
      fx: '3 * (1 - exp(-0.05 * (v + (v - 2)^2 / 16))) + 0.7 * exp(-0.05 * (v + (v - 2)^2 / 16)) * sin(u) - 0.75',
      fy: '0.5 * -cos(v + (v - 2)^2 / 16) * exp(-0.05 * (v + (v - 2)^2 / 16)) * (1 + 1.4 * cos(u))',
      fz: '0.5 * -sin(v + (v - 2)^2 / 16) * exp(-0.05 * (v + (v - 2)^2 / 16)) * (1 + 1.4 * cos(u))',
      u0: -3.142, u1: 3.142,
      v0: -2, v1: 25
    }
  },
  {
    name: 'Trefoil',
    definition: {
      fx: 'sin(3 * u) / (2 + cos(v))',
      fy: '(sin(u) + 2 * sin(2 * u)) / (2 + cos(v + 2*pi/3))',
      fz: '(cos(u) - 2 * cos(2 * u)) * (2 + cos(v)) * (2 + cos(v + 2*pi/3)) / 8',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Horn',
    definition: {
      fx: '(2 + u * cos(v)) * sin(2*pi * u)',
      fy: 'u * sin(v)',
      fz: '(2 + u * cos(v)) * cos(2*pi * u) + 2 * u - 2',
      u0: 0.001, u1: 1,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Crescent',
    definition: {
      fx: '0.5 * (2 + sin(2*pi * u) * sin(2*pi * v)) * sin(3*pi * v)',
      fy: '0.5 * (2 + sin(2*pi * u) * sin(2*pi * v)) * cos(3*pi * v)',
      fz: '0.5 * cos(2*pi * u) * sin(2*pi * v) + 2 * v - 1',
      u0: 0, u1: 1,
      v0: 0.001, v1: 0.999
    }
  },
  {
    name: 'Sea Shell',
    definition: {
      fx: '(1 - v / (2*pi)) * cos(3 * v) * (1 + cos(u)) + 0.3 * cos(3 * v)',
      fy: '(1 - v / (2*pi)) * sin(3 * v) * (1 + cos(u)) + 0.3 * sin(3 * v)',
      fz: '6 * v / (2*pi) + (1 - v / (2*pi)) * sin(u) - 1',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Triaxial Tritorus',
    definition: {
      fx: 'sin(u) * (1 + cos(v))',
      fy: 'sin(u + 2*pi/3) * (1 + cos(v + 2*pi/3))',
      fz: 'sin(u + 4*pi/3) * (1 + cos(v + 4*pi/3))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Triaxial Hexatorus',
    definition: {
      fx: 'sin(u) / (sqrt(2) + cos(v))',
      fy: 'sin(u + 2*pi/3) / (sqrt(2) + cos(v + 2*pi/3))',
      fz: 'cos(u - 2*pi/3) / (sqrt(2) + cos(v - 2*pi/3))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Folium',
    definition: {
      fx: 'cos(u) * (2 * v / pi - tanh(v))',
      fy: 'cos(u + 2 * pi / 3) / cosh(v)',
      fz: 'cos(u - 2 * pi / 3) / cosh(v)',
      u0: -3.142, u1: 3.142,
      v0: -3.142, v1: 3.142
    }
  },
  {
    name: 'Catenoid',
    definition: {
      fx: 'cosh(v) * cos(u)',
      fy: 'cosh(v) * sin(u)',
      fz: 'v',
      u0: 0, u1: 6.284,
      v0: -1.5, v1: 1.5
    }
  },
  {
    name: 'Helicoid',
    definition: {
      fx: 'v * cos(u)',
      fy: 'v * sin(u)',
      fz: 'u',
      u0: -3, u1: 3,
      v0: -3, v1: 3
    }
  },
  {
    name: 'Enneper',
    definition: {
      fx: 'u - u^3 / 3 + u * v*v',
      fy: 'v - v^3 / 3 + v * u*u',
      fz: 'u*u - v*v',
      u0: -2, u1: 2,
      v0: -2, v1: 2
    }
  },
  {
    name: 'Pillow',
    definition: {
      fx: 'cos(u)',
      fy: 'cos(v)',
      fz: '0.5 * sin(u) * sin(v)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Twisted Pipe',
    definition: {
      fx: 'cos(v) * (2 + cos(u)) / sqrt(1 + sin(v)^2)',
      fy: 'sin(v + 2*pi/3) * (2 + cos(u + 2*pi/3)) / sqrt(1 + sin(v)^2)',
      fz: 'sin(v - 2*pi/3) * (2 + cos(u - 2*pi/3)) / sqrt(1 + sin(v)^2)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Tetrahedral Ellipse',
    definition: {
      fx: '(1 - v) * cos(u)',
      fy: '(1 + v) * sin(u)',
      fz: 'v',
      u0: -3.142, u1: 3.142,
      v0: -1, v1: 1
    }
  },
  {
    name: 'Apple',
    definition: {
      fx: '0.2 * cos(u) * (4 + 3.8 * cos(v))',
      fy: '0.2 * sin(u) * (4 + 3.8 * cos(v))',
      fz: '0.2 * (cos(v) + sin(v) - 1) * (1 + sin(v)) * ln(1 - pi * v / 10) + 1.5 * sin(v)',
      u0: 0, u1: 6.284,
      v0: -3.142, v1: 3.142,
    }
  },
  {
    name: 'Bow Curve',
    definition: {
      fx: '(2 + sin(u) / 2) * sin(2 * v)',
      fy: '(2 + sin(u) / 2) * cos(2 * v)',
      fz: 'cos(u) / 2 + 3 * cos(v)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  }
];

var ParametricControls = class {
  constructor() {

    const updateDefinition = debounce(() => {
      if (this.onDefinition) {
        this.onDefinition();
      }
    }, 500).function;

    const updateInput = () => {
      this.definitionPreset.add('Custom');
      this.definitionPreset.value = 'Custom';
      updateDefinition();
    };

    this.fx = new EquationInput('x(u, v)', ['u', 'v'], updateInput);
    this.fy = new EquationInput('y(u, v)', ['u', 'v'], updateInput);
    this.fz = new EquationInput('z(u, v)', ['u', 'v'], updateInput);

    this.uFrom = new NumberInput('<var>u</var> From', updateInput, {step: 0.1});
    this.uTo = new NumberInput('<var>u</var> To', updateInput, {step: 0.1});

    this.vFrom = new NumberInput('<var>v</var> From', updateInput, {step: 0.1});
    this.vTo = new NumberInput('<var>v</var> To', updateInput, {step: 0.1});

    this.definitionPreset = new SelectInput('Preset', () => {
      this.definitionPreset.remove('Custom');
      this.definition = parametricEquationPresets[this.definitionPreset.value].definition;
      if (this.onDefinition) {
        this.onDefinition();
      }
    });

    for (let i = 0; i < parametricEquationPresets.length; i++) {
      this.definitionPreset.add(parametricEquationPresets[i].name, i);
    }
    this.definition = parametricEquationPresets[this.definitionPreset.value].definition;

    this.domElement = buildDomTree(
      createElem('div', {class: 'parametricControls'}), [
        controlGroup(), [
          this.definitionPreset.domElement
        ],
        controlGroup(), [
          createElem('h3', null, 'Equation'),
          this.fx.domElement,
          this.fy.domElement,
          this.fz.domElement,
          createElem('p', null, 'Hover over an input box for a list of built-in functions')
        ],
        controlGroup(), [
          createElem('h3', null, 'Domain'),
          inputRow(), [
            this.uFrom.domElement,
            this.uTo.domElement
          ],
          inputRow(), [
            this.vFrom.domElement,
            this.vTo.domElement
          ]
        ]
      ]
    );
  }

  set definition(definition) {
    this.fx.value = definition.fx;
    this.fy.value = definition.fy;
    this.fz.value = definition.fz;
    this.uFrom.value = definition.u0; this.uTo.value = definition.u1;
    this.vFrom.value = definition.v0; this.vTo.value = definition.v1;
  }

  get definition() {
    return {
      u0: this.uFrom.value, u1: this.uTo.value,
      v0: this.vFrom.value, v1: this.vTo.value,
      fx: this.fx.function,
      fy: this.fz.function,
      fz: this.fy.function
      // Swap y and z so that the z-coordinate points towards the sky
    };
  }
};

var CheckboxInput = class {
  constructor(name, onInput, {value = false} = {}) {
    this.input = createElem('input', {type: 'checkbox'});
    this.input.checked = value;
    this.input.addEventListener('change', onInput);

    this.domElement = buildDomTree(
      createElem('label', {class: 'checkboxInput'}), [
        createElem('span', null, name),
        this.input
      ]
    );
  }

  set value(x) {
    this.input.checked = x;
  }

  get value() {
    return this.input.checked;
  }
};

var implicitEquationPresets = [
  {name: 'Cayley Cubic', equation: '4 * (x*x + y*y + z*z) + 16 * x * y * z - 1'},
  {name: 'Clebsch Cubic', equation: '81 * (x^3 + y^3 + z^3) - 189 * (x*x * (y + z) + y*y * (z + x) + z*z * (x + y)) + 54 * x*y*z + 126 * (x*y + y*z + z*x) - 9 * (x*x + x + y*y + y + z*z + z) + 1'},
  {name: 'Kummer Quartic', equation: '(x*x + y*y + z*z - 1.69)^2 - 3.11 * ((1 - z)^2 - 2 * x*x) * ((1 + z)^2 - 2*y*y)'},
  {name: 'Barth Sextic', equation: '4 * (2.62 * x*x - y*y) * (2.62 * y*y - z*z) * (2.62 * z*z - x*x) - 4.24 * (x*x + y*y + z*z - 1)^2'},
  {name: 'Barth Decic', equation: '8 * (x*x - 6.85 * y*y) * (y*y - 6.85 * z*z) * (z*z - 6.85 * x*x) * (x^4 + y^4 + z^4 - 2 * x*x * y*y - 2 * x*x * z*z - 2 * y*y * z*z) + 11.1 * (x*x + y*y + z*z - 1)^2 * (x*x + y*y + z*z - 0.38)^2'},
  {name: 'Bretzel2', equation: '(((1 - x*x) * x*x - y*y)^2 + z*z / 2) / (1 + x*x + y*y + z*z) - 0.02'},
  {name: 'Bretzel5', equation: '((x*x + y*y / 4 - 1) * (x*x / 4 + y*y - 1))^2 + z*z / 2 - 0.08'},
  {name: 'Pilz', equation: '((x*x + y*y - 1)^2 + (z - 1)^2) * ((x^2 + (z - 0.3)^2 - 1)^2 + y*y) - 0.1'},
  {name: 'Orthocircles', equation: '((x*x + y*y - 1)^2 + z*z) * ((y*y + z*z - 1)^2 + x*x) * ((z*z + x*x - 1)^2 + y*y) - 0.02'},
  {name: 'DecoCube', equation: '((x*x + y*y - 0.64)^2 + (z*z - 1)^2) * ((y*y + z*z - 0.64)^2 + (x*x - 1)^2) * ((z*z + x*x - 0.64)^2 + (y*y - 1)^2) - 0.04'},
  {name: 'Borg Surface', equation: 'sin(x * y) + sin(y * z) + sin(z * x)'},
  {name: 'Tangle', equation: 'x*x * (x*x - 5) + y*y * (y*y - 5) + z*z * (z*z - 5) + 11.8'},
  {name: 'Chair', equation: '(x*x + y*y + z*z - 14.8)^2 - 0.8 * ((z - 4)^2 - 2 * x*x) * ((z + 4)^2 - 2 * y*y)'},
  {name: 'Devil Surface', equation: 'x^4 + 2 * x*x * z*z - 0.36 * x*x - y^4 + 0.25 * y*y + z^4'},
  {name: 'P1 Atomic orbital', equation: 'abs(x * exp(-0.5 * sqrt(x*x + y*y + z*z))) - 0.1'},
  {name: 'Tubey', equation: '-3 * x^8 - 3 * y^8 - 2 * z^8 + 5 * x^4 * y^2 * z^2 + 3 * x^2 * y^4 * z^2 - 4 * (x^3 + y^3 + z^3 + 1) + (x + y + z + 1)^4 + 1'},
  {name: 'The Blob', equation: 'x*x + y*y + z*z + sin(4*x) + sin(4*y) + sin(4*z) - 1'},
  {name: 'McMullen K3', equation: '(1 + x*x) * (1 + y*y) * (1 + z*z) + 8 * x * y * z - 2'},
  {name: 'Weird', equation: '25 * (x^3 * (y + z) + y^3 * (x + z) + z^3 * (x + y)) + 50 *(x*x * y*y + x*x * z*z + y*y * z*z) - 125 * (x*x * y * z + x * y*y * z + x * y * z*z) + 60 * x * y * z - 4 * (x * y + x * z + y * z)'},
  {name: 'Gerhard Miehlich', equation: '(z*z - 1)^2 - 2 * (x*x + y*y)'},
  {name: 'Kampyle of Eudoxus', equation: 'y*y + z*z - x^4 + x^2'},
  {name: 'Cayley Surface', equation: '-5 * (x*x * y + x*x * z + y*y * x + y*y * z + z*z * y + z*z * x) + 2 * (x * y + x * z + y * z)'},
  {name: 'Tooth Surface', equation: 'x^4 + y^4 + z^4 - (x*x + y*y + z*z)'},
  {name: 'Wiffle Cube', equation: '1 - (0.19 * (x*x + y*y + z*z))^-6 - (0.004 * (x^8 + y^8 + z^8))^6'},
  {name: 'Horned Cube', equation: '-3 * x^8 - 3 * y^8 - 2 * z^8 + 5 * x^4 * y*y * z*z + 3 * x*x * y^4 * z*z + 1'},
  {name: 'Lemnescate of Gerono', equation: 'x^4 - x*x + y*y + z*z'}
];

var ImplicitControls = class {
  constructor() {

    const updateEquation = debounce(() => {
      if (this.onEquation) {
        this.onEquation();
      }
    }, 500).function;

    // Swap y and z so that the z-coordinate points towards the sky
    this.equationInput = new EquationInput('f(x, y, z)', ['x', 'z', 'y'], () => {
      this.equationPreset.add('Custom');
      this.equationPreset.value = 'Custom';
      updateEquation();
    });

    this.equationPreset = new SelectInput('Preset', () => {
      this.equationPreset.remove('Custom');
      this.equationInput.value = implicitEquationPresets[this.equationPreset.value].equation;
      if (this.onEquation) {
        this.onEquation();
      }
    });

    for (let i = 0; i < implicitEquationPresets.length; i++) {
      this.equationPreset.add(implicitEquationPresets[i].name, i);
    }
    this.equationInput.value = implicitEquationPresets[this.equationPreset.value].equation;

    const updateOscillate = debounce(() => {
      if (this.onOscillate) {
        this.onOscillate();
      }
    }, 250, true).function;

    this.oscillateAmp = new NumberInput('Amplitude', updateOscillate, {value: 0.5, min: 0, step: 0.1});
    this.oscillateAmp.domElement.style.display = 'none';

    this.oscillateFreq = new NumberInput('Frequency', updateOscillate, {value: 0.5, min: 0, step: 0.1});
    this.oscillateFreq.domElement.style.display = 'none';

    this.oscillateEnabled = new CheckboxInput('Enable', () => {
      this.oscillateAmp.domElement.style.display = this.oscillateEnabled.value ? '' : 'none';
      this.oscillateFreq.domElement.style.display = this.oscillateEnabled.value ? '' : 'none';
      updateOscillate();
    });

    this.domElement = buildDomTree(
      createElem('div', {class: 'implicitControls'}), [
        controlGroup(), [this.equationPreset.domElement],
        controlGroup(), [
          createElem('h3', null, 'Equation'),
          this.equationInput.domElement,
          createElem('p', null, 'Hover over the input box for a list of built-in functions.')
        ],
        controlGroup(), [
          createElem('h3', null, 'Oscillate'),
          createElem('p', null, 'Add a time-variable sinusoid to the equation.'),
          inputRow(), [this.oscillateEnabled.domElement],
          inputRow(), [this.oscillateAmp.domElement],
          inputRow(), [this.oscillateFreq.domElement]
        ]
      ]
    );
  }

  get equation() {
    return this.equationInput.function;
  }

  get oscillate() {
    return this.oscillateEnabled.value ?
      {amplitude: this.oscillateAmp.value, frequency: this.oscillateFreq.value / 1000} :
      null;
  }
};

var GraphicsControls = class {
  constructor() {
    this.environmentSelect = new SelectInput('Scene', () => {
      if (this.onEnvironment) {
        this.onEnvironment(this.environmentSelect.value);
      }
    });

    this.materialSelect = new SelectInput('Texture', () => {
      if (this.onMaterial) {
        this.onMaterial(this.materialSelect.value);
      }
    });

    const updateOptions = () => {
      if (this.onMaterialOptions) {
        this.onMaterialOptions(this.materialOptions);
      }
    };

    this.uvScale = new NumberInput('Texture Scale', updateOptions, {min: 0, max: 100, value: 50});

    this.useParallaxMap = new CheckboxInput('Parallax Mapping', updateOptions, {value: true});
    this.enableShadows = new CheckboxInput('Shadows', () => {
      if (this.onEnableShadows) {
        this.onEnableShadows(this.enableShadows.value);
      }
    }, {value: true});
    this.meshQualitySelect = new SelectInput('Mesh Quality', () => {
      if (this.onMeshQuality) {
        this.onMeshQuality(this.meshQuality);
      }
    });
    this.meshQualitySelect.add('Low', 0);
    this.meshQualitySelect.add('Medium', 1);
    this.meshQualitySelect.add('High', 2);
    this.meshQualitySelect.value = 'Medium';

    this.domElement = buildDomTree(
      createElem('div', {class: 'graphicsControls'}), [
        controlGroup(), [
          createElem('h3', null, 'Environment'),
          this.environmentSelect.domElement,
        ],
        controlGroup(), [
          createElem('h3', null, 'Material'),
          inputRow(), [this.materialSelect.domElement],
          inputRow(), [this.uvScale.domElement],
        ],
        controlGroup(), [
          createElem('h3', null, 'Performance'),
          createElem('p', null, 'If camera movement feels sluggish, lower these settings.'),
          inputRow(), [this.meshQualitySelect.domElement],
          inputRow(), [this.useParallaxMap.domElement],
          inputRow(), [this.enableShadows.domElement]
        ]
      ]
    );
  }

  addEnvironments(names) {
    for (let name of names) {
      this.environmentSelect.add(name);
    }
    if (this.onEnvironment) {
      this.onEnvironment(this.environmentSelect.value);
    }
  }

  addMaterials(names) {
    for (let name of names) {
      this.materialSelect.add(name);
    }
    if (this.onMaterial) {
      this.onMaterial(this.materialSelect.value);
    }
  }

  get materialOptions() {
    return {
      uvScale: 0.5 * Math.pow(1.3, this.uvScale.value - 50),
      useParallaxMap: this.useParallaxMap.value,
    };
  }

  get meshQuality() {
    return this.meshQualitySelect.value;
  }

  get shadowsEnabled() {
    return this.enableShadows.value;
  }
};

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
const camera = new THREE.PerspectiveCamera(75, 1, 0.25, 100);
const render = throttleAnimationFrame(() => {
  renderer.render(scene, camera);
}).function;

function resize() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  render();
}

const material = new SurfaceMaterial({
  side: THREE.DoubleSide
});
material.roughness = 0.75;
material.metalness = 0;
material.color = 0xffffff;
material.normalScale = new THREE.Vector2(1, -1);

const mesh = new THREE.Mesh();
mesh.material = material;
mesh.frustumCulled = false;
mesh.castShadow = true;
mesh.receiveShadow = true;

const orbitControls = new OrbitControls(camera, mesh, canvas);
orbitControls.onUpdate = render;

class ParametricGeometry {
  constructor() {
    this._surface = new ParametricSurface();
    this._tweens = new TweenFactory();
  }

  _enableMorphTargets(enable) {
    material.morphTargets = enable;
    material.morphNormals = enable;
    material.needsUpdate = true;
  }

  render(definition, resolution) {
    this._tweens.stopAll();

    const {animatable} = this._surface.generate(definition, resolution);
    mesh.geometry = this._surface.geometry;

    if (animatable) {
      this._enableMorphTargets(true);
      mesh.morphTargetInfluences = [1];
      this._tweens.create(mesh.morphTargetInfluences)
        .duration(3000)
        .to({0: 0})
        .onComplete(() => this._enableMorphTargets(false))
        .onUpdate(render)
        .start();
    }
    else {
      this._enableMorphTargets(false);
      render();
    }
  }

  destroy() {
    this._surface.dispose();
    this._tweens.stopAll();
    mesh.morphTargetInfluences = [0];
    this._enableMorphTargets(false);
  }
}

class ImplicitGeometry {
  constructor() {
    this._highQualitySurface = new ImplicitSurface();
    this._lowQualitySurface = new ImplicitSurface();
    this._implicitSurfaceAnimator = new ImplicitSurfaceAnimator();

    let usingHighQualitySurface = false;

    this._highQualityGenerate = debounce(() => {
      const r = Math.round(Math.pow(14, 1/3) * this._resolution);
      this._highQualitySurface.generate(this._implicitSurfaceAnimator.equation, orbitControls.center, orbitControls.radius, r);
      mesh.geometry = this._highQualitySurface.geometry;
      usingHighQualitySurface = true;
      render();
    }, 150);

    this._lowQualityGenerate = throttleAnimationFrame(() => {
      this._lowQualitySurface.generate(this._implicitSurfaceAnimator.equation, orbitControls.center, orbitControls.radius, this._resolution);
      mesh.geometry = this._lowQualitySurface.geometry;
      usingHighQualitySurface = false;
      render();
      this._highQualityGenerate.function();
    });

    this._implicitSurfaceAnimator.onUpdate = this._lowQualityGenerate.function;
    orbitControls.onPan = this._lowQualityGenerate.function;
    orbitControls.onScale = this._lowQualityGenerate.function;
    orbitControls.onRotate = () => {
      if (!usingHighQualitySurface) {
        this._highQualityGenerate.function();
      }
    };
  }

  render(equation, resolution, morphDuration, oscillate) {
    this._resolution = resolution;
    this._implicitSurfaceAnimator.morph(equation, morphDuration, oscillate);
  }

  destroy() {
    this._lowQualitySurface.dispose();
    this._highQualitySurface.dispose();
    this._implicitSurfaceAnimator.stop();
    this._lowQualityGenerate.cancel();
    this._highQualityGenerate.cancel();
    orbitControls.onPan = null;
    orbitControls.onScale = null;
    orbitControls.onRotate = null;
  }
}

function setEnvironment({cubemap, lights}) {
  scene.remove(...scene.children);
  scene.add(mesh);
  if (cubemap) {
    scene.background = cubemap;
    material.envMap = cubemap;
  }
  if (lights) {
    scene.add(lights);
  }
  material.needsUpdate = true;
  render();
}

let materialProperties = {};

function setMaterialOptions({uvScale, useParallaxMap}) {
  material.uniforms.uvScale.value = uvScale;
  material.parallaxMap = useParallaxMap ? materialProperties.parallaxMap : null;
  material.needsUpdate = true;
  render();
}

function setMaterial(properties, options) {
  materialProperties = properties;

  for (let [prop, value] of Object.entries(properties)) {
    if (material[prop] instanceof THREE.Texture) {
      material[prop].dispose();
    }
    material[prop] = value;
  }

  setMaterialOptions(options);
}

function enableShadows(enable) {
  renderer.shadowMap.enabled = enable;
  material.needsUpdate = true;
  render();
}

const environmentLoader = new EnvironmentLoader('presets/environments');
const materialLoader = new MaterialLoader('presets/materials', renderer.capabilities.getMaxAnisotropy());

window.addEventListener('resize', resize);
resize();

// ---------------
// User Interface
// ---------------

const loadPrompt = document.getElementById('loadPrompt');

THREE.DefaultLoadingManager.onStart = () => {
  loadPrompt.style.display = '';
};

THREE.DefaultLoadingManager.onLoad = () => {
  loadPrompt.style.display = 'none';
};

const graphicsControls = new GraphicsControls();

graphicsControls.onEnvironment = name => {
  environmentLoader.load(name)
    .then(setEnvironment)
    .catch(() => {}); // user switched scene mid-download
};

graphicsControls.onMaterial = name => {
  materialLoader.load(name)
    .then(properties => {
      setMaterial(properties, graphicsControls.materialOptions);
    })
    .catch(() => {}); // user switched material mid-download
};

graphicsControls.onMaterialOptions = setMaterialOptions;
graphicsControls.onEnableShadows = enableShadows;

const surfaceControls = new Tabs();

let activeGeometry;
let firstLoad = true;

const implicitControls = new ImplicitControls();

surfaceControls.add('Implicit', implicitControls.domElement, () => {
  orbitControls.resetPosition();

  if (activeGeometry) {
    activeGeometry.destroy();
  }
  activeGeometry = new ImplicitGeometry();

  const setGeometryFromControls = morphDuration => {
    const resolution = [25, 44, 60][graphicsControls.meshQuality];
    activeGeometry.render(implicitControls.equation, resolution, morphDuration, implicitControls.oscillate);
  };

  implicitControls.onEquation = () => setGeometryFromControls(4000);
  implicitControls.onOscillate = () => setGeometryFromControls(2000);
  graphicsControls.onMeshQuality = () => setGeometryFromControls(0);

  setGeometryFromControls(firstLoad ? 10000 : 0);

  firstLoad = false;
});

const parametricControls = new ParametricControls();

surfaceControls.add('Parametric', parametricControls.domElement, () => {
  orbitControls.resetPosition();

  if (activeGeometry) {
    activeGeometry.destroy();
  }
  activeGeometry = new ParametricGeometry();

  const setGeometryFromControls = () => {
    const resolution = [64, 128, 256][graphicsControls.meshQuality];
    activeGeometry.render(parametricControls.definition, resolution);
  };

  parametricControls.onDefinition = setGeometryFromControls;
  graphicsControls.onMeshQuality = setGeometryFromControls;

  setGeometryFromControls();

  firstLoad = false;
});

buildDomTree(
  document.getElementById('inputs'), [
    createElem('h2', {class: 'withTabs'}, 'Surface Type'),
    surfaceControls.domElement,
    createElem('h2', null, 'Graphics'),
    graphicsControls.domElement
  ]
);

setEnvironment(environmentLoader.default);

request('presets/index.json').promise
  .then(names => {
    graphicsControls.addEnvironments(names.environments);
    graphicsControls.addMaterials(names.materials);
  });

}(THREE));
