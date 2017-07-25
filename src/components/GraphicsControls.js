import { createElem, buildDomTree } from '../util';
import { inputGroup, inputRow } from '../commonElements';
import SelectInput from './SelectInput';
import NumberInput from './NumberInput';

export default class {
  constructor() {
    this.environmentSelect = new SelectInput('Scene', () => this.updateEnvironment());

    this.materialSelect = new SelectInput('Texture', () => this.updateMaterial());

    const updateOptions = () => {
      if (this.onMaterialOptions) {
        this.onMaterialOptions(this.materialOptions);
      }
    };

    this.uvScale = new NumberInput('Texture Scale', updateOptions, {min: 1, max: 10});
    this.uvScale.domElement.title = 'The higher the scale, the smaller the texture.';
    this.uvScale.value = 3;

    this.domElement = buildDomTree(
      createElem('div', {class: 'parametricControls content'}), [
        inputGroup(), [
          createElem('h3', null, 'Environment'),
          this.environmentSelect.domElement,
        ],
        inputGroup(), [
          createElem('h3', null, 'Material'),
          inputRow(), [this.materialSelect.domElement],
          inputRow(), [this.uvScale.domElement]
        ]
      ]
    );
  }

  updateEnvironment() {
    if (this.onEnvironment) {
      this.onEnvironment(this.environmentSelect.value);
    }
  }

  updateMaterial() {
    if (this.onMaterial) {
      this.onMaterial(this.materialSelect.value);
    }
  }

  addEnvironments(names) {
    for (let name of names) {
      this.environmentSelect.add(name);
    }
    this.updateEnvironment();
  }

  addMaterials(names) {
    for (let name of names) {
      this.materialSelect.add(name);
    }
    this.updateMaterial();
  }

  get materialOptions() {
    return {
      uvScale: Math.max(1, this.uvScale.value)
    };
  }
}