import { createElem, buildDomTree, debounce } from '../util';
import { inputGroup, inputRow } from '../commonElements';
import SelectInput from './SelectInput.js';
import RangeInput from './RangeInput.js';

export default class {
  constructor() {
    this.environmentSelect = new SelectInput('Preset', () => {
      if (this.onEnvironment) {
        this.onEnvironment(this.environmentSelect.value);
      }
    });

    this.materialPreset = new SelectInput('Texture');
    this.materialPreset.add('None');

    const updateMaterial = () => {
      if (this.onMaterial) {
        this.onMaterial(this.material);
      }
    };

    this.materialInput = {
      roughness: new RangeInput('Roughness', updateMaterial),
      metalness: new RangeInput('Metalness', updateMaterial),
      reflectivity: new RangeInput('Reflectivity', updateMaterial),
    };

    this.materialInput.roughness.value = 0.5;
    this.materialInput.metalness.value = 0;
    this.materialInput.reflectivity.value = 0.5;

    this.domElement = buildDomTree(
      createElem('div', {class: 'parametricControls content'}), [
        inputGroup(), [
          createElem('h3', null, 'Environment'),
          this.environmentSelect.domElement,
        ],
        inputGroup(), [
          createElem('h3', null, 'Material'),
          inputRow(), [this.materialPreset.domElement],
          inputRow(), [this.materialInput.roughness.domElement],
          inputRow(), [this.materialInput.metalness.domElement],
          inputRow(), [this.materialInput.reflectivity.domElement],
        ]
      ]
    );
  }

  addEnvironments(names) {
    for (let name of names) {
      this.environmentSelect.add(name);
    }
    if (this.onEnvironment) {
      this.onEnvironment(this.environmentSelect.value);
    }
  }

  get material() {
    const definition = {};
    for (let name in this.materialInput) {
      definition[name] = this.materialInput[name].value;
    }
    return definition;
  }
}