import { createElem, buildDomTree, debounce } from '../util';
import { inputGroup } from '../commonElements';
import EquationInput from './EquationInput';

export default class {
  constructor() {

    const update = debounce(() => {
      if (this.onDefinition) {
        this.onDefinition(this.definition);
      }
    }, 500);

    this.equation = new EquationInput('f(x, y, z)', ['x', 'y', 'z'], update);

    this.defaultValues();

    this.domElement = buildDomTree(
      createElem('div', {class: 'implicitControls content'}), [
        inputGroup(), [
          createElem('h3', null, 'Equation'),
          this.equation.domElement,
        ],
      ]
    );
  }

  defaultValues() {
    this.equation.value = 'x*x + y*y + z*z - 1';
    // this.equation.value = 'cos(x) + sin(y) + z';
    // this.equation.value = 'cos(x) + sin(y) + sin(z)';
    // this.equation.value = 'x*cos(z) + y*cos(x) + z*z - 1';
  }

  get definition() {
    return {
      equation: this.equation.function
    };
  }
}
