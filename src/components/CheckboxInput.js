import { createElem, buildDomTree } from '../util';

export default class {
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
}