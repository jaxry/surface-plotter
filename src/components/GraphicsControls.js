import { createElem, buildDomTree } from '../util';
import { inputGroup, inputRow } from '../commonElements';
import SelectInput from './SelectInput';
import NumberInput from './NumberInput';
import CheckboxInput from './CheckboxInput';

export default class {
  constructor() {
    this.environmentSelect = new SelectInput('Scene', () => this.updateEnvironment());

    this.materialSelect = new SelectInput('Texture', () => this.updateMaterial());

    const updateOptions = () => {
      if (this.onMaterialOptions) {
        this.onMaterialOptions(this.materialOptions);
      }
    };

    this.uvScale = new NumberInput('Texture Scale', updateOptions, {min: 0, max: 10, value: 5});
    this.uvScale.domElement.title = 'The higher the scale, the smaller the texture.';

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
          inputRow(), [this.meshQualitySelect.domElement],
          inputRow(), [this.useParallaxMap.domElement]
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
      uvScale: 0.4 * Math.pow(1.3, this.uvScale.value - 5),
      useParallaxMap: this.useParallaxMap.value,
    };
  }

  get meshQuality() {
    return this.meshQualitySelect.value;
  }
}