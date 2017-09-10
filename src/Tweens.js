import Timer from './Timer';

// incomplete implementation
// based on the tween.js library

class Tween {
  constructor(factory, fromObj) {
    this._factory = factory;
    this._duration = 1000;
    this._easing = TweenFactory.easing.smootherstep;
    this._chain = [];

    if (fromObj) {
      this.from(fromObj);
    }
  }

  _update() {
    this._timer.update();
    let t = this._timer.elapsed / this._duration;

    if (t >= 1) {
      t = 1;
      this._factory._stop(this);
      if (this._onComplete) {
        this._onComplete(1, this._current);
      }
      for (let tween of this._chain) {
        tween.start();
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
    this._timer = new Timer();
    this._interpolate = this._from && this._to;
    this._factory._start(this);
    if (this._onStart) {
      this._onStart(0, this._current);
    }
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

  chain(...tweens) {
    this._chain = this._chain.concat(tweens);
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

  _update() {
    if (this.updating) {
      for (let tween of this.tweens) {
        tween._update();
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

export default TweenFactory;