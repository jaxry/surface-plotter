import { createElem, buildDomTree, debounce } from '../util';
import { controlGroup, inputRow } from '../commonElements';
import EquationInput from './EquationInput';
import CheckboxInput from './CheckboxInput';
import NumberInput from './NumberInput';
import SelectInput from './SelectInput';
import implicitEquationPresets from '../implicitEquationPresets';

export default class {
  constructor() {

    const updateEquation = debounce(() => {
      if (this.onEquation) {
        this.onEquation();
      }
    }, 500).function;

    // Swap y and z so that the z-coordinate points towards the sky
    this.equationInput = new EquationInput('f(x, y, z)', ['x', 'z', 'y'], () => {
      this.equationPreset.add('Custom');
      this.equationPreset.value = 'Custom';
      updateEquation();
    });

    this.equationPreset = new SelectInput('Preset', () => {
      this.equationPreset.remove('Custom');
      this.equationInput.value = implicitEquationPresets[this.equationPreset.value].equation;
      if (this.onEquation) {
        this.onEquation();
      }
    });

    for (let i = 0; i < implicitEquationPresets.length; i++) {
      this.equationPreset.add(implicitEquationPresets[i].name, i);
    }
    this.equationInput.value = implicitEquationPresets[this.equationPreset.value].equation;

    const updateOscillate = debounce(() => {
      if (this.onOscillate) {
        this.onOscillate();
      }
    }, 250, true).function;

    this.oscillateAmp = new NumberInput('Amplitude', updateOscillate, {value: 0.5, min: 0, step: 0.1});
    this.oscillateAmp.domElement.style.display = 'none';

    this.oscillateFreq = new NumberInput('Frequency', updateOscillate, {value: 0.5, min: 0, step: 0.1});
    this.oscillateFreq.domElement.style.display = 'none';

    this.oscillateEnabled = new CheckboxInput('Enable', () => {
      this.oscillateAmp.domElement.style.display = this.oscillateEnabled.value ? '' : 'none';
      this.oscillateFreq.domElement.style.display = this.oscillateEnabled.value ? '' : 'none';
      updateOscillate();
    });

    this.domElement = buildDomTree(
      createElem('div', {class: 'implicitControls'}), [
        controlGroup(), [this.equationPreset.domElement],
        controlGroup(), [
          createElem('h3', null, 'Equation'),
          this.equationInput.domElement,
          createElem('p', null, 'Hover over the input box for a list of built-in functions.')
        ],
        controlGroup(), [
          createElem('h3', null, 'Oscillate'),
          createElem('p', null, 'Add a time-variable sinusoid to the equation.'),
          inputRow(), [this.oscillateEnabled.domElement],
          inputRow(), [this.oscillateAmp.domElement],
          inputRow(), [this.oscillateFreq.domElement]
        ]
      ]
    );
  }

  get equation() {
    return this.equationInput.function;
  }

  get oscillate() {
    return this.oscillateEnabled.value ?
      {amplitude: this.oscillateAmp.value, frequency: this.oscillateFreq.value / 1000} :
      null;
  }
}
