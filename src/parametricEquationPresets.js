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
  {
    name: 'Trefoil',
    definition: {
      fx: 'sin(3 * u) / (2 + cos(v))',
      fy: '(sin(u) + 2 * sin(2 * u)) / (2 + cos(v + 2*pi/3))',
      fz: '(cos(u) - 2 * cos(2 * u)) * (2 + cos(v)) * (2 + cos(v + 2*pi/3)) / 8',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Horn',
    definition: {
      fx: '(2 + u * cos(v)) * sin(2*pi * u)',
      fy: 'u * sin(v)',
      fz: '(2 + u * cos(v)) * cos(2*pi * u) + 2 * u - 2',
      u0: 0.001, u1: 1,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Crescent',
    definition: {
      fx: '0.5 * (2 + sin(2*pi * u) * sin(2*pi * v)) * sin(3*pi * v)',
      fy: '0.5 * (2 + sin(2*pi * u) * sin(2*pi * v)) * cos(3*pi * v)',
      fz: '0.5 * cos(2*pi * u) * sin(2*pi * v) + 2 * v - 1',
      u0: 0, u1: 1,
      v0: 0.001, v1: 0.999
    }
  },
  {
    name: 'Sea Shell',
    definition: {
      fx: '(1 - v / (2*pi)) * cos(3 * v) * (1 + cos(u)) + 0.3 * cos(3 * v)',
      fy: '(1 - v / (2*pi)) * sin(3 * v) * (1 + cos(u)) + 0.3 * sin(3 * v)',
      fz: '6 * v / (2*pi) + (1 - v / (2*pi)) * sin(u) - 1',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Triaxial Tritorus',
    definition: {
      fx: 'sin(u) * (1 + cos(v))',
      fy: 'sin(u + 2*pi/3) * (1 + cos(v + 2*pi/3))',
      fz: 'sin(u + 4*pi/3) * (1 + cos(v + 4*pi/3))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Triaxial Hexatorus',
    definition: {
      fx: 'sin(u) / (sqrt(2) + cos(v))',
      fy: 'sin(u + 2*pi/3) / (sqrt(2) + cos(v + 2*pi/3))',
      fz: 'cos(u - 2*pi/3) / (sqrt(2) + cos(v - 2*pi/3))',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Folium',
    definition: {
      fx: 'cos(u) * (2 * v / pi - tanh(v))',
      fy: 'cos(u + 2 * pi / 3) / cosh(v)',
      fz: 'cos(u - 2 * pi / 3) / cosh(v)',
      u0: -3.142, u1: 3.142,
      v0: -3.142, v1: 3.142
    }
  },
  {
    name: 'Catenoid',
    definition: {
      fx: 'cosh(v) * cos(u)',
      fy: 'cosh(v) * sin(u)',
      fz: 'v',
      u0: 0, u1: 6.284,
      v0: -1.5, v1: 1.5
    }
  },
  {
    name: 'Helicoid',
    definition: {
      fx: 'v * cos(u)',
      fy: 'v * sin(u)',
      fz: 'u',
      u0: -3, u1: 3,
      v0: -3, v1: 3
    }
  },
  {
    name: 'Enneper',
    definition: {
      fx: 'u - u^3 / 3 + u * v*v',
      fy: 'v - v^3 / 3 + v * u*u',
      fz: 'u*u - v*v',
      u0: -2, u1: 2,
      v0: -2, v1: 2
    }
  },
  {
    name: 'Pillow',
    definition: {
      fx: 'cos(u)',
      fy: 'cos(v)',
      fz: '0.5 * sin(u) * sin(v)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Twisted Pipe',
    definition: {
      fx: 'cos(v) * (2 + cos(u)) / sqrt(1 + sin(v)^2)',
      fy: 'sin(v + 2*pi/3) * (2 + cos(u + 2*pi/3)) / sqrt(1 + sin(v)^2)',
      fz: 'sin(v - 2*pi/3) * (2 + cos(u - 2*pi/3)) / sqrt(1 + sin(v)^2)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  },
  {
    name: 'Tetrahedral Ellipse',
    definition: {
      fx: '(1 - v) * cos(u)',
      fy: '(1 + v) * sin(u)',
      fz: 'v',
      u0: -3.142, u1: 3.142,
      v0: -1, v1: 1
    }
  },
  {
    name: 'Apple',
    definition: {
      fx: '0.2 * cos(u) * (4 + 3.8 * cos(v))',
      fy: '0.2 * sin(u) * (4 + 3.8 * cos(v))',
      fz: '0.2 * (cos(v) + sin(v) - 1) * (1 + sin(v)) * ln(1 - pi * v / 10) + 1.5 * sin(v)',
      u0: 0, u1: 6.284,
      v0: -3.142, v1: 3.142,
    }
  },
  {
    name: 'Bow Curve',
    definition: {
      fx: '(2 + sin(u) / 2) * sin(2 * v)',
      fy: '(2 + sin(u) / 2) * cos(2 * v)',
      fz: 'cos(u) / 2 + 3 * cos(v)',
      u0: 0, u1: 6.284,
      v0: 0, v1: 6.284
    }
  }
];
