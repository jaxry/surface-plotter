import Tweens from './Tweens';

export default class {
  constructor() {
    this._tweens = new Tweens();
    this.equation = (x, y, z) => x*x + y*y + z*z - 1;
    this.onUpdate;
  }

  skipAnimation(equation) {
    this.equation = equation;

    if (this.onUpdate) {
      this.onUpdate();
    }
  }

  animate(equation) {
    const lastEquation = this.equation;

    this._tweens.stopAll();

    let time = 0;
    this.equation = (x, y, z) => (1 - time) * lastEquation(x, y, z) + time * equation(x, y, z);

    this._tweens.create()
      .duration(4000)
      .onUpdate(t => {
        time = t;
        if (this.onUpdate) {
          this.onUpdate();
        }
      })
      .onComplete(() => {
        this.equation = equation;
      })
      .start();
  }

  stop() {
    this._tweens.stopAll();
  }
}