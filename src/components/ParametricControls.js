import { createElem, buildDomTree, debounce } from '../util';
import { controlGroup, inputRow } from '../commonElements';
import EquationInput from './EquationInput';
import NumberInput from './NumberInput';
import SelectInput from './SelectInput';
import parametricEquationPresets from '../parametricEquationPresets';

export default class {
  constructor() {

    const updateDefinition = debounce(() => {
      if (this.onDefinition) {
        this.onDefinition();
      }
    }, 500).function;

    const updateInput = () => {
      this.definitionPreset.add('Custom');
      this.definitionPreset.value = 'Custom';
      updateDefinition();
    };

    this.fx = new EquationInput('x(u, v)', ['u', 'v'], updateInput);
    this.fy = new EquationInput('y(u, v)', ['u', 'v'], updateInput);
    this.fz = new EquationInput('z(u, v)', ['u', 'v'], updateInput);

    this.uFrom = new NumberInput('<var>u</var> From', updateInput, {step: 0.1});
    this.uTo = new NumberInput('<var>u</var> To', updateInput, {step: 0.1});

    this.vFrom = new NumberInput('<var>v</var> From', updateInput, {step: 0.1});
    this.vTo = new NumberInput('<var>v</var> To', updateInput, {step: 0.1});

    this.definitionPreset = new SelectInput('Preset', () => {
      this.definitionPreset.remove('Custom');
      this.definition = parametricEquationPresets[this.definitionPreset.value].definition;
      if (this.onDefinition) {
        this.onDefinition();
      }
    });

    for (let i = 0; i < parametricEquationPresets.length; i++) {
      this.definitionPreset.add(parametricEquationPresets[i].name, i);
    }
    this.definition = parametricEquationPresets[this.definitionPreset.value].definition;

    this.domElement = buildDomTree(
      createElem('div', {class: 'parametricControls'}), [
        controlGroup(), [
          this.definitionPreset.domElement
        ],
        controlGroup(), [
          createElem('h3', null, 'Equation'),
          this.fx.domElement,
          this.fy.domElement,
          this.fz.domElement,
          createElem('p', null, 'Hover over an input box for a list of built-in functions')
        ],
        controlGroup(), [
          createElem('h3', null, 'Domain'),
          inputRow(), [
            this.uFrom.domElement,
            this.uTo.domElement
          ],
          inputRow(), [
            this.vFrom.domElement,
            this.vTo.domElement
          ]
        ]
      ]
    );
  }

  set definition(definition) {
    this.fx.value = definition.fx;
    this.fy.value = definition.fy;
    this.fz.value = definition.fz;
    this.uFrom.value = definition.u0; this.uTo.value = definition.u1;
    this.vFrom.value = definition.v0; this.vTo.value = definition.v1;
  }

  get definition() {
    return {
      u0: this.uFrom.value, u1: this.uTo.value,
      v0: this.vFrom.value, v1: this.vTo.value,
      fx: this.fx.function,
      fy: this.fz.function,
      fz: this.fy.function
      // Swap y and z so that the z-coordinate points towards the sky
    };
  }
}
