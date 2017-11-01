import Tweens from './Tweens';

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

export default class {
  constructor() {
    this.equation = (x, y, z) => x*x + y*y + z*z - 1;
    this._tweens = new Tweens();

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
        .easing(Tweens.easing.linear)
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
}