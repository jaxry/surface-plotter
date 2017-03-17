export default class {
  constructor() {
    this.start = Date.now();
    this.previous = this.start;
  }

  update() {
    const now = Date.now();
    this.dt = now - this.previous;
    this.elapsed = now - this.start;
    this.previous = now;
  }
}