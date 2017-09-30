import { createElem, buildDomTree } from '../util';
import { inputGroup, inputRow } from '../commonElements';
import SelectInput from './SelectInput';
import NumberInput from './NumberInput';
import CheckboxInput from './CheckboxInput';

export default class {
  constructor() {
    this.environmentSelect = new SelectInput('Scene', () => {
      if (this.onEnvironment) {
        this.onEnvironment(this.environmentSelect.value);
      }
    });

    this.materialSelect = new SelectInput('Texture', () => {
      if (this.onMaterial) {
        this.onMaterial(this.materialSelect.value);
      }
    });

    const updateOptions = () => {
      if (this.onMaterialOptions) {
        this.onMaterialOptions(this.materialOptions);
      }
    };

    this.uvScale = new NumberInput('Texture Scale', updateOptions, {min: 0, max: 100, value: 50});

    this.useParallaxMap = new CheckboxInput('Parallax Mapping', updateOptions, {value: true});
    this.meshQualitySelect = new SelectInput('Mesh Quality', () => {
      if (this.onMeshQuality) {
        this.onMeshQuality(this.meshQuality);
      }
    });
    this.meshQualitySelect.add('Low', 0);
    this.meshQualitySelect.add('Medium', 1);
    this.meshQualitySelect.add('High', 2);
    this.meshQualitySelect.value = 1;

    this.domElement = buildDomTree(
      createElem('div', {class: 'parametricControls content'}), [
        inputGroup(), [
          createElem('h3', null, 'Environment'),
          this.environmentSelect.domElement,
        ],
        inputGroup(), [
          createElem('h3', null, 'Material'),
          inputRow(), [this.materialSelect.domElement],
          inputRow(), [this.uvScale.domElement],
        ],
        inputGroup(), [
          createElem('h3', null, 'Performance'),
          createElem('p', null, 'If camera movement feels sluggish, disable Parallax Mapping or lower the Mesh Quality.'),
          inputRow(), [this.meshQualitySelect.domElement],
          inputRow(), [this.useParallaxMap.domElement]
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

  addMaterials(names) {
    for (let name of names) {
      this.materialSelect.add(name);
    }
    if (this.onMaterial) {
      this.onMaterial(this.materialSelect.value);
    }
  }

  get materialOptions() {
    return {
      uvScale: 0.4 * Math.pow(1.3, this.uvScale.value - 50),
      useParallaxMap: this.useParallaxMap.value,
    };
  }

  get meshQuality() {
    return this.meshQualitySelect.value;
  }
}