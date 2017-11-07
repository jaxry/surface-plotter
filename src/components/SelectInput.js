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
    if (!this.select.namedItem(name)) {
      this.select.add(createElem('option', {value, name}, name));
    }
  }

  remove(name) {
    const optionElem = this.select.namedItem(name);
    if (optionElem) {
      this.select.remove(optionElem.index);
    }
  }

  get value() {
    return this.select.value;
  }

  set value(name) {
    const optionElem = this.select.namedItem(name);
    if (optionElem) {
      this.select.selectedIndex = optionElem.index;
    }
  }
}