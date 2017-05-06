import { createElem, buildDomTree } from '../util';

function evalEquation(equation) {
  const eq = new Function(`
    const
      e = Math.E, pi = Math.PI,
      cos = Math.cos, sin = Math.sin, tan = Math.tan,
      acos = Math.acos, asin = Math.asin, atan = Math.atan, atan2 = Math.atan2,
      cosh = Math.cosh, sinh = Math.sinh, tanh = Math.tanh,
      acosh = Math.acosh, asinh = Math.asinh, atanh = Math.atanh,
      sqrt = Math.sqrt, pow = Math.pow, exp = Math.exp, log = Math.log,
      abs = Math.abs, ceil = Math.ceil, floor = Math.floor, max = Math.max, min = Math.min,
      random = Math.random, sign = Math.sign, round = Math.round;

    return (u, v) => ${equation} || 0;
  `)();

  eq(); // call equation to check for reference errors

  return eq;
}

export default class {
  constructor(name, onInput) {
    this.textarea = createElem('textarea');

    this.textarea.addEventListener('input', () => {
      this.eval();
      onInput(this.equation);
    });

    this.domElement = buildDomTree(
      createElem('label', {class: 'equationInput'}), [
        createElem('var', null, name),
        this.textarea
      ]
    );
  }

  set value(value) {
    this.textarea.value = value;
    this.eval();
  }

  get value() {
    return this.textarea.value;
  }

  eval() {
    try {
      this.equation = evalEquation(this.value);
      this.textarea.setCustomValidity('');
      this.domElement.title = '';
    }
    catch (e) {
      this.textarea.setCustomValidity('Invalid equation');
      this.domElement.title = 'Invalid equation';
    }
    return this.equation;
  }
}