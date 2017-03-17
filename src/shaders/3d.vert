export default `#version 300 es

  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNormal;

  uniform mat4 uMVP;
  uniform mat4 uModel;

  out vec3 vPos;
  out vec3 vNormal;

  void main() {
    vec4 modelPos = uModel * vec4(aPos, 1);

    vPos = modelPos.xyz;
    vNormal = mat3(uModel) * aNormal;

    gl_Position = uMVP * vec4(aPos, 1);
  }
`;