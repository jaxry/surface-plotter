export default `#version 300 es

  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNormal;
  layout(location=2) in vec3 aPosBack;
  layout(location=3) in vec3 aNormalBack;

  uniform mat4 uMVP;
  uniform mat4 uModel;
  uniform float uInterpolate;

  out vec3 vPos;
  out vec3 vNormal;

  void main() {
    vec3 interPos = mix(aPosBack, aPos, uInterpolate);
    vec3 interNormal = normalize(mix(aNormalBack, aNormal, uInterpolate));

    vPos = (uModel * vec4(interPos, 1)).xyz;
    vNormal = mat3(uModel) * interNormal;

    gl_Position = uMVP * vec4(interPos, 1);
  }
`;