import { createElem, buildDomTree } from '../util';

function functionFromEquation(inputs, equation) {
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

    this.domElement.title = "Constants: e, pi\nFunctions: abs(x), acos(x), acosh(x), asin(x), asinh(x), atan(x), atanh(x), atan2(y, x), ceil(x), cos(x), cosh(x), exp(x), floor(x), log(x), pow(x, y), round(x), sign(x), sin(x), sinh(x), sqrt(x), tan(x), tanh(x)";
  }

  _eval() {
    try {
      this.function = functionFromEquation(this.equationInputs, this.value);
      this.textarea.setCustomValidity('');
    }
    catch (e) {
      this.textarea.setCustomValidity('Invalid equation');
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