import Timer from './Timer';

// incomplete implementation

class Tween {
  constructor(factory) {
    this._factory = factory;
    this.duration = 1000;
    this.easing = TweenFactory.easing.linear;
  }

  start() {
    this.timer = new Timer();
  }

  update() {
    this.timer.update();
    let t = this.timer.elapsed / this.duration;
    
    if (t >= 1) {
      t = 1;
      this._factory._stop(this);
    }

    t = this.easing(t);

    if (this.onUpdate) {
      this.onUpdate(t);
    }
  }
}

class TweenFactory {
  constructor() {
    this.tweens = new Set();
  }

  create() {
    const t = new Tween(this);
    this.tweens.add(t);
    return t;
  }

  update() {
    for (let tween of this.tweens) {
      tween.update();
    }
  }

  _start(tween) {
    this.tweens.add(tween);
  }

  _stop(tween) {
    this.tweens.delete(tween);
  }
}

TweenFactory.easing = {
  linear: t => t,
  smoothstep: t => t * t * (3 - 2 * t),
  smootherstep: t => t * t * t * (t * (t * 6 - 15) + 10)
};

export default TweenFactory;