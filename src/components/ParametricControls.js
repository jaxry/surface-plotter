import { createElem, buildDomTree, throttle } from '../util';
import EquationInput from './EquationInput';
import NumberInput from './NumberInput';
import CheckboxInput from './CheckboxInput';

export default class {
  constructor() {
    const update = throttle(() => {
      if (this.ondefinition) {
        const definition = this.getDefinition();
        this.ondefinition(definition);
      }
    }, 300);

    this.fx = new EquationInput('x(u, v)', update);
    this.fy = new EquationInput('y(u, v)', update);
    this.fz = new EquationInput('z(u, v)', update);

    this.uStart = new NumberInput('<var>u</var> Start', update, 0.1);
    this.uEnd = new NumberInput('<var>u</var> End', update, 0.1);

    this.vStart = new NumberInput('<var>v</var> Start', update, 0.1);
    this.vEnd = new NumberInput('<var>v</var> End', update, 0.1);

    this.uClosed = new CheckboxInput('Close <var>u</var>', update);
    this.vClosed = new CheckboxInput('Close <var>v</var>', update);

    this.rows = new NumberInput('Rows', update, 1);
    this.columns = new NumberInput('Columns', update, 1);

    this.defaultValues();

    const inputGroup = () => createElem('div', {class: 'inputGroup'});
    const inputRow = () => createElem('div', {class: 'inputRow'});
 
    this.domElement = buildDomTree({
      parent: createElem('div', {class: 'parametricControls'}),
      children: [
        createElem('h1', null, 'Parametric Surface Plotter'),
        {
          parent: inputGroup(),
          children: [
            createElem('h2', null, 'Equation'),
            this.fx.domElement, this.fy.domElement, this.fz.domElement,
          ]
        },
        {
          parent: inputGroup(),
          children: [
            createElem('h2', null, 'Domain'),
            { 
              parent: inputRow(),
              children: [this.uStart.domElement, this.uEnd.domElement]
            },
            { 
              parent: inputRow(),
              children: [this.vStart.domElement, this.vEnd.domElement]
            },
            {
              parent: inputRow(),
              children: [this.uClosed.domElement, this.vClosed.domElement]
            }
          ]
        },
        {
          parent: inputGroup(),
          children: [
            createElem('h2', null, 'Mesh Detail'),
            { 
              parent: inputRow(),
              children: [this.rows.domElement, this.columns.domElement]
            }
          ]
        }
      ]
    });
  }

  defaultValues() {
    this.fx.value = '(1 + 0.5 * cos(v)) * cos(u)';
    this.fy.value = '(1 + 0.5 * cos(v)) * sin(u)';
    this.fz.value = '0.5 * sin(v)';
    this.uStart.value = 0; this.uEnd.value = 6.283;
    this.vStart.value = 0; this.vEnd.value = 6.283;
    this.uClosed.value = true; this.vClosed.value = true;
    this.rows.value = 96; this.columns.value = 96;
  }
  
  getDefinition() {
    const definition = {
      u: [this.uStart.value, this.uEnd.value],
      v: [this.vStart.value, this.vEnd.value],
      fx: this.fx.equation,
      fy: this.fy.equation,
      fz: this.fz.equation,
      uClosed: this.uClosed.value,
      vClosed: this.vClosed.value,
      rows: Math.round(this.rows.value),
      columns: Math.round(this.columns.value)
    };
    return definition;
  }
}

// const r = 1;
// const u0 = 0;
// const u1 = 2 * Math.PI;
// const v0 = 0;
// const v1 = 0.5 * Math.PI;
// const fx = (u, v) => r * r * cos(v) * sin(v) * sin(u);
// const fy = (u, v) => r * r * cos(v) * sin(v) * cos(u);
// const fz = (u, v) => r * r * cos(v) * cos(v) * cos(u) * sin(u);
// const loop = false;