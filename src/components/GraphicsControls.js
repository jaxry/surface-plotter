import { createElem, buildDomTree, debounce } from '../util';
import SelectInput from './SelectInput.js';

export default class {
  constructor() {
    this.environment = new SelectInput('Environment', () => {
      if (this.onEnvironmentChange) {
        this.onEnvironmentChange(this.environment.value);
      }
    });

    const inputGroup = () => createElem('div', {class: 'inputGroup'});
    const inputRow = () => createElem('div', {class: 'inputRow'});

    this.domElement = buildDomTree(
      createElem('div', {class: 'parametricControls content'}), [
        inputGroup(), [
          this.environment.domElement,
        ]
      ]
    );
  }

  addEnvironments(names) {
    for (let name of names) {
      this.environment.add(name);
    }
    if (this.onEnvironmentChange) {
      this.onEnvironmentChange(this.environment.value);
    }
  }
}