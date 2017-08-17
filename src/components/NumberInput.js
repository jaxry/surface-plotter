import { createElem, buildDomTree } from '../util';

export default class {
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
}