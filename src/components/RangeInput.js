import { createElem, buildDomTree } from '../util';

export default class {
  constructor(name, onInput, {step = 0.05, min = 0, max = 1} = {}) {
    this.range = createElem('input', {type: 'range', step, min, max});
    this.number = createElem('input', {type: 'number', step, min});

    this.range.addEventListener('input', () => this.number.value = this.range.value);
    this.range.addEventListener('input', onInput);

    this.number.addEventListener('input', () => this.range.value = this.number.value);
    this.number.addEventListener('input', onInput);

    this.domElement = buildDomTree(
      createElem('label', {class: 'rangeInput'}), [
        createElem('span', null, name),
        this.range,
        this.number
      ]
    );
  }

  set value(x) {
    this.range.value = x;
    this.number.value = x;
  }

  get value() {
    return Number(this.number.value);
  }
}