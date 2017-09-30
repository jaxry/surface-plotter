import { createElem, buildDomTree, debounce } from '../util';
import { inputGroup } from '../commonElements';
import EquationInput from './EquationInput';

export default class {
  constructor() {

    const update = debounce(() => {
      if (this.onDefinition) {
        this.onDefinition();
      }
    }, 500);

    // Swap y and z so that the z-coordinate points towards the sky
    this.equationInput = new EquationInput('f(x, y, z)', ['x', 'z', 'y'], update);

    this.defaultValues();

    this.domElement = buildDomTree(
      createElem('div', {class: 'implicitControls content'}), [
        inputGroup(), [
          createElem('h3', null, 'Equation'),
          this.equationInput.domElement,
          createElem('p', null, 'Hover over the input box for a list of built-in functions.')
        ],
      ]
    );
  }

  defaultValues() {
    this.equationInput.value = 'cos(x + z) + cos(y + x) + cos(y + z + 2)';
  }

  get equation() {
    return this.equationInput.function;
  }
}
