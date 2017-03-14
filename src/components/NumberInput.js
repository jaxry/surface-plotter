import { createElem, buildDomTree } from '../util';

export default class {
  constructor(name, onInput, step = 1) {
    this.input = createElem('input', {type: 'number', step});
    this.input.addEventListener('input', onInput);

    this.domElement = buildDomTree({
      parent: createElem('label', {class: 'numberInput' }),
      children: [
        createElem('span', null, name),
        this.input
      ]
    });
  }

  set value(x) {
    this.input.value = x;
  }

  get value() {
    return Number(this.input.value);
  }
}