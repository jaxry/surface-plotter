export default function(positions, elements, normals) {
  if (!normals) {
    normals = new Float32Array(positions.length);
  }
  for (let i = 0; i < elements.length; i += 3) {
    const e1 = 3 * elements[i];
    const e2 = 3 * elements[i+1];
    const e3 = 3 * elements[i+2];
    const vx = positions[e2 + 0] - positions[e1 + 0];
    const vy = positions[e2 + 1] - positions[e1 + 1];
    const vz = positions[e2 + 2] - positions[e1 + 2];
    const wx = positions[e3 + 0] - positions[e2 + 0];
    const wy = positions[e3 + 1] - positions[e2 + 1];
    const wz = positions[e3 + 2] - positions[e2 + 2];
    const nx = vy * wz - vz * wy;
    const ny = vz * wx - vx * wz;
    const nz = vx * wy - vy * wx;
    normals[e1 + 0] += nx; normals[e1 + 1] += ny; normals[e1 + 2] += nz;
    normals[e2 + 0] += nx; normals[e2 + 1] += ny; normals[e2 + 2] += nz;
    normals[e3 + 0] += nx; normals[e3 + 1] += ny; normals[e3 + 2] += nz;
  }

  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.sqrt(normals[i]*normals[i] + normals[i+1]*normals[i+1] + normals[i+2]*normals[i+2]);
    normals[i] /= length;
    normals[i+1] /= length;
    normals[i+2] /= length;
  }
  // for (let i = 0; i < normals.length; i++) {
  //   normals[i] = 2 * (Math.random() - 0.5);
  // }

  return normals;
}