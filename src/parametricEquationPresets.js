export default [
  {
    name: 'Torus',
    definition: {
      fx: '(1 + 0.5 * cos(v)) * cos(u)',
      fy: '0.5 * sin(v)',
      fz: '(1 + 0.5 * cos(v)) * sin(u)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Bianchi-Pinkall Flat Torus',
    definition: {
      fx: 'cos(u + v) * cos(0.25 + 0.25 * sin(10 * v)) /  (1 - sin(u - v) * sin(0.25 + 0.25 * sin(10 * v)))',
      fy: 'sin(u + v) * cos(0.25 + 0.25 * sin(10 * v)) /  (1 - sin(u - v) * sin(0.25 + 0.25 * sin(10 * v)))',
      fz: 'cos(u - v) * sin(0.25 + 0.25 * sin(10 * v)) /  (1 - sin(u - v) * sin(0.25 + 0.25 * sin(10 * v)))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Klein Bottle',
    definition: {
      fx: '0.5 * (1.5 + cos(v / 2) * sin(u) - sin(v / 2) * sin(2 * u)) * cos(v)',
      fy: '0.5 * (1.5 + cos(v / 2) * sin(u) - sin(v / 2) * sin(2 * u)) * sin(v)',
      fz: '0.5 * (sin(v / 2) * sin(u) + cos(v / 2) * sin(2 * u))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Cross-Cap',
    definition: {
      fx: 'sin(u) * sin(2 * v) / 2',
      fy: 'sin(2 * u) * cos(v)^2',
      fz: 'cos(2 * u) * cos(v)^2',
      u0: 0, u1: 3.142,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Boy\'s Surface',
    definition: {
      fx: '(sqrt(2) * cos(v)^2 * cos(2 * u) + cos(u) * sin(2 * v)) / (2 - sqrt(2) * sin(3 * u) * sin(2 * v))',
      fy: '(sqrt(2) * cos(v)^2 * sin(2 * u) - sin(u) * sin(2 * v)) / (2 - sqrt(2) * sin(3 * u) * sin(2 * v))',
      fz: '3 * cos(v)^2 / (2 - sqrt(2) * sin(3 * u) * sin(2 * v)) - 1.5',
      u0: 0, u1: 3.142,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Steiner Surface',
    definition: {
      fx: 'sin(2 * u) * cos(v)^2',
      fy: 'sin(u) * sin(2 * v)',
      fz: 'cos(u) * sin(2 * v)',
      u0: 0, u1: 3.142,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Breather Surface',
    definition: {
      fx: '-u + (2 * (1 - 0.6^2) * cosh(0.6 * u) * sinh(0.6 * u)) / ((1 - 0.6^2) * cosh(0.6 * u)^2 + 0.6^2 * sin(sqrt(1 - 0.6^2)*v)^2) / 0.6',
      fy: '(2 * sqrt(1 - 0.6^2) * cosh(0.6 * u) * (-sqrt(1 - 0.6^2) * cos(v) * cos(sqrt(1 - 0.6^2) * v) - sin(v) * sin(sqrt(1 - 0.6^2) * v))) / ((1 - 0.6^2) * cosh(0.6 * u)^2 + 0.6^2 * sin(sqrt(1 - 0.6^2)*v)^2) / 0.6',
      fz: '(2 * sqrt(1 - 0.6^2) * cosh(0.6 * u) * (-sqrt(1 - 0.6^2) * sin(v) * cos(sqrt(1 - 0.6^2) * v) + cos(v) * sin(sqrt(1 - 0.6^2) * v))) / ((1 - 0.6^2) * cosh(0.6 * u)^2 + 0.6^2 * sin(sqrt(1 - 0.6^2)*v)^2) / 0.6',
      u0: -8, u1: 8,
      v0: -15.7, v1: 15.7
    }
  },
  {
    name: 'Kuen Surface',
    definition: {
      fx: '(2 * (cos(u) + u * sin(u)) * sin(v)) / (1 + u * u * sin(v)^2)',
      fy: '(2 * (sin(u) - u * cos(u)) * sin(v)) / (1 + u * u * sin(v)^2)',
      fz: 'log(tan(v / 2)) + 2 * cos(v) / (1 + u * u * sin(v)^2)',
      u0: -4.494, u1: 4.494,
      v0: 0, v1: 3.142
    }
  },
  {
    name: 'Snail shell',
    definition: {
      fx: '3 * (1 - exp(-0.05 * (v + (v - 2)^2 / 16))) + 0.7 * exp(-0.05 * (v + (v - 2)^2 / 16)) * sin(u) - 0.75',
      fy: '0.5 * -cos(v + (v - 2)^2 / 16) * exp(-0.05 * (v + (v - 2)^2 / 16)) * (1 + 1.4 * cos(u))',
      fz: '0.5 * -sin(v + (v - 2)^2 / 16) * exp(-0.05 * (v + (v - 2)^2 / 16)) * (1 + 1.4 * cos(u))',
      u0: -3.142, u1: 3.142,
      v0: -2, v1: 25
    }
  },
];