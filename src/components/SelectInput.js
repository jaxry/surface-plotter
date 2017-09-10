import { createElem, buildDomTree } from '../util';

export default class {
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
    this.select.appendChild(createElem('option', {value}, name));
  }

  get value() {
    return this.select.value;
  }

  set value(index) {
    this.select.selectedIndex = index;
  }
}