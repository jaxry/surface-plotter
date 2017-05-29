import { createElem, buildDomTree } from '../util';

function evalEquation(inputs, equation) {
  const eq = new Function(`
    const ${
      Object.getOwnPropertyNames(Math)
      .map(n => `${n.toLowerCase()}=Math.${n}`)
      .join(',')
    };

    return (${inputs.join(',')}) => ${equation} || 0;
  `)();

  eq(); // call equation to check for reference errors

  return eq;

}

export default class {
  constructor(name, equationInputs, onInput) {
    this.equationInputs = equationInputs;

    this.textarea = createElem('textarea');

    this.textarea.addEventListener('input', () => {
      this._eval();
      onInput(this.function);
    });

    this.domElement = buildDomTree(
      createElem('label', {class: 'equationInput'}), [
        createElem('var', null, name),
        this.textarea
      ]
    );
  }

  _eval() {
    try {
      this.function = evalEquation(this.equationInputs, this.value);
      this.textarea.setCustomValidity('');
      this.domElement.title = '';
    }
    catch (e) {
      this.textarea.setCustomValidity('Invalid equation');
      this.domElement.title = 'Invalid equation';
    }
    return this.function;
  }

  set value(value) {
    this.textarea.value = value;
    this._eval();
  }

  get value() {
    return this.textarea.value;
  }
}