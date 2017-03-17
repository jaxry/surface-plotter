import squareTiling from './squareTiling';

const eps = 0.001;

export default function(definition) {
  const {fx, fy, fz, u0, u1, v0, v1, rows, columns} = definition;

  const {uv, elements} = squareTiling({rows, columns});

  const positions = new Float32Array(uv.length / 2 * 3);
  const normals = new Float32Array(positions.length);

  for (let i = 0; i < uv.length; i += 2) {
    const u = u0 + uv[i+0] * (u1 - u0);
    const v = v0 + uv[i+1] * (v1 - v0);
    const j = Math.floor(i / 2) * 3;
    positions[j+0] = fx(u, v);
    positions[j+1] = fy(u, v);
    positions[j+2] = fz(u, v);

    // r(u, v) = (fx(u,v), fy(u,v), fz(u,v));
    
    // r_u, the partial derivative of r(u, v) with respect to u
    const ux = fx(u+eps, v) - fx(u-eps, v);
    const uy = fy(u+eps, v) - fy(u-eps, v);
    const uz = fz(u+eps, v) - fz(u-eps, v);

    // r_y, the partial derivative of r(u, v) with respect to v
    const vx = fx(u, v+eps) - fx(u, v-eps);
    const vy = fy(u, v+eps) - fy(u, v-eps);
    const vz = fz(u, v+eps) - fz(u, v-eps);

    // Cross product of r_v and r_u
    const nx = vy * uz - vz * uy;
    const ny = vz * ux - vx * uz;
    const nz = vx * uy - vy * ux;

    const length = Math.sqrt(nx*nx + ny*ny + nz*nz);
    normals[j+0] = nx / length;
    normals[j+1] = ny / length;
    normals[j+2] = nz / length;
  }

  return {
    positions,
    normals,
    uv,
    elements
  };
}
