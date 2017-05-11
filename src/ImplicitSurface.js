import * as THREE from 'three';
import Surface from './Surface';

export default class extends Surface {
  constructor() {
    super();
  }

  generate(definition) {
    this._newGeometry(0);
  }
}
