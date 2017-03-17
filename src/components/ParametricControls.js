import { createElem, buildDomTree, debounce } from '../util';
import EquationInput from './EquationInput';
import NumberInput from './NumberInput';

export default class {
  constructor() {
    const update = debounce(() => {
      if (this.ondefinition) {
        const definition = this.getDefinition();
        this.ondefinition(definition);
      }
    }, 500);

    this.fx = new EquationInput('x(u, v)', update);
    this.fy = new EquationInput('y(u, v)', update);
    this.fz = new EquationInput('z(u, v)', update);

    this.uStart = new NumberInput('<var>u</var> Start', update, 0.1);
    this.uEnd = new NumberInput('<var>u</var> End', update, 0.1);

    this.vStart = new NumberInput('<var>v</var> Start', update, 0.1);
    this.vEnd = new NumberInput('<var>v</var> End', update, 0.1);

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
    // torus
    this.fx.value = '(1 + 0.5 * cos(v)) * cos(u)';
    this.fy.value = '(1 + 0.5 * cos(v)) * sin(u)';
    this.fz.value = '0.5 * sin(v)';
    this.uStart.value = 0; this.uEnd.value = 6.2832;
    this.vStart.value = 0; this.vEnd.value = 6.2832;

    // klein bottle
    // this.fx.value = '(2 + cos(u/2) * sin(v) - sin(u/2) * sin(2*v)) * cos(u)';
    // this.fy.value = 'sin(u/2) * sin(v) + cos(u/2) * sin(2*v)';
    // this.fz.value = '(2 + cos(u/2) * sin(v) - sin(u/2) * sin(2*v)) * sin(u)';
    // this.uStart.value = 0; this.uEnd.value = 6.283;
    // this.vStart.value = 0; this.vEnd.value = 6.283;

    // steiner surface
    // this.fx.value = '3 * cos(v) * sin(v) * sin(u)';
    // this.fy.value = '3 * cos(v) * sin(v) * cos(u)';
    // this.fz.value = '3 * cos(v) * cos(v) * cos(u) * sin(u)';
    // this.uStart.value = 0; this.uEnd.value = 6.2832;
    // this.vStart.value = 0; this.vEnd.value = 1.58;


    this.rows.value = 96; this.columns.value = 96;
  }
  
  getDefinition() {
    const definition = {
      u0: this.uStart.value, u1: this.uEnd.value,
      v0: this.vStart.value, v1: this.vEnd.value,
      fx: this.fx.equation,
      fy: this.fy.equation,
      fz: this.fz.equation,
      rows: Math.round(this.rows.value),
      columns: Math.round(this.columns.value)
    };
    return definition;
  }
}
