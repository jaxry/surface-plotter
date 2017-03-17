export default `#version 300 es
  precision highp float;

  uniform vec3 uCamPos;
  uniform vec3 uLightPos;

  in vec3 vPos;
  in vec3 vNormal;

  out vec4 fragColor;

  const float ambientStrength = 0.4;
  const float diffuseStrength = 0.4;
  const float specularStrength = 0.2;

  void main() {
    vec3 correctedNorm = gl_FrontFacing ? normalize(vNormal) : normalize(-vNormal);

    vec3 lightDir = normalize(uLightPos - vPos);
    vec3 viewDir = normalize(uCamPos - vPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float diff = max(dot(correctedNorm, lightDir), 0.0);
    float spec = pow(max(dot(correctedNorm, halfwayDir), 0.0), 128.);

    vec3 lighting = (ambientStrength + diffuseStrength * diff + specularStrength * spec) * vec3(1, 1, 1);  

    vec3 col = lighting * (0.5 + 0.5 * correctedNorm);
    fragColor = vec4(col, 1);
  }
`;