export default class {
  constructor(gl) {
    this.gl = gl;
  }

  makeShader(type, src) {
    const s = this.gl.createShader(type);
    this.gl.shaderSource(s, src);
    this.gl.compileShader(s);

    const log = this.gl.getShaderInfoLog(s);
    if (log) {
      console.log(log);
    }

    return s;
  }

  makeVertexShader(src) {
    return this.makeShader(this.gl.VERTEX_SHADER, src);
  }

  makeFragmentShader(src) {
    return this.makeShader(this.gl.FRAGMENT_SHADER, src);
  }

  makeProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    return program;
  }

  getUniformLocations(program) {
    const locs = {};
    const activeUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < activeUniforms; i++) {
      const uniform = this.gl.getActiveUniform(program, i);
      locs[uniform.name] = this.gl.getUniformLocation(program, uniform.name);
    }

    return locs;
  }
}