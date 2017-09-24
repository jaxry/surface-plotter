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
        ],
      ]
    );
  }

  defaultValues() {
    // this.equation.value = 'x*x + y*y + z*z - 1';
    // this.equation.value = 'cos(x) + sin(y) + z';
    // this.equation.value = 'cos(x) + cos(y) + cos(z)';
    this.equationInput.value = 'cos(x + z) + cos(y + x) + cos(y + z + 2)';
    // this.equation.value = 'y*cos(x + z) + z*x - 5*sin(y) -1';
  }

  get equation() {
    return this.equationInput.function;
  }
}
