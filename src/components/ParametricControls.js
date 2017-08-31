import { createElem, buildDomTree, debounce, clamp } from '../util';
import { inputGroup, inputRow } from '../commonElements';
import EquationInput from './EquationInput';
import NumberInput from './NumberInput';

export default class {
  constructor() {

    const update = debounce(() => {
      if (this.onDefinition) {
        this.onDefinition(this.definition);
      }
    }, 500);

    this.fx = new EquationInput('x(u, v)', ['u', 'v'], update);
    this.fy = new EquationInput('y(u, v)', ['u', 'v'], update);
    this.fz = new EquationInput('z(u, v)', ['u', 'v'], update);

    this.uStart = new NumberInput('<var>u</var> Start', update, {step: 0.1});
    this.uEnd = new NumberInput('<var>u</var> End', update, {step: 0.1});

    this.vStart = new NumberInput('<var>v</var> Start', update, {step: 0.1});
    this.vEnd = new NumberInput('<var>v</var> End', update, {step: 0.1});

    this.rows = new NumberInput('Rows / Columns', update, {min: 2, max: 512});

    this.defaultValues();

    this.domElement = buildDomTree(
      createElem('div', {class: 'parametricControls content'}), [
        inputGroup(), [
          createElem('h3', null, 'Equation'),
          this.fx.domElement,
          this.fy.domElement,
          this.fz.domElement,
        ],
        inputGroup(), [
          createElem('h3', null, 'Domain'),
          inputRow(), [
            this.uStart.domElement,
            this.uEnd.domElement
          ],
          inputRow(), [
            this.vStart.domElement,
            this.vEnd.domElement
          ]
        ],
        inputGroup(), [
          createElem('h3', null, 'Mesh Detail'),
          this.rows.domElement,
        ]
      ]
    );
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

    // plane
    // this.fx.value = '0';
    // this.fy.value = 'u';
    // this.fz.value = 'v';
    // this.uStart.value = 0; this.uEnd.value = 3;
    // this.vStart.value = 0; this.vEnd.value = 3;

    this.rows.value = 128;
  }

  get definition() {
    const rows = clamp(Math.round(this.rows.value), 2, 512);
    return {
      u0: this.uStart.value, u1: this.uEnd.value,
      v0: this.vStart.value, v1: this.vEnd.value,
      fx: this.fx.function,
      fy: this.fy.function,
      fz: this.fz.function,
      rows: rows,
      columns: rows
    };
  }
}
