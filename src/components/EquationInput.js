import { createElem, buildDomTree } from '../util';

function functionFromEquation(inputs, equation) {
  equation = equation.replace(/\^/g, '**'); // replace ^ with the exponentiation operator

  const eq = new Function(`
    const ${
      Object.getOwnPropertyNames(Math)
      .map(n => `${n.toLowerCase()}=Math.${n}`)
      .join(',')
    };
    const ln = Math.log;

    return (${inputs.join(',')}) => ${equation};
  `)();

  const type = typeof eq();

  if (type !== 'number' && type !== 'undefined') {
    throw TypeError;
  }

  return eq;
}

export default class {
  constructor(name, equationInputs, onInput) {
    this.equationInputs = equationInputs;

    this.textarea = createElem('textarea', {spellcheck: false});

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

    this.domElement.title = 'Constants: e, pi\nFunctions: abs(x), acos(x), acosh(x), asin(x), asinh(x), atan(x), atanh(x), atan2(y, x), ceil(x), cos(x), cosh(x), exp(x), floor(x), ln(x), pow(x, y), round(x), sign(x), sin(x), sinh(x), sqrt(x), tan(x), tanh(x)';
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