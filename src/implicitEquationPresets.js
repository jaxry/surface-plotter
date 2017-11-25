export default [
  {name: 'Cayley Cubic', equation: '4 * (x*x + y*y + z*z) + 16 * x * y * z - 1'},
  {name: 'Clebsch Cubic', equation: '81 * (x^3 + y^3 + z^3) - 189 * (x*x * (y + z) + y*y * (z + x) + z*z * (x + y)) + 54 * x*y*z + 126 * (x*y + y*z + z*x) - 9 * (x*x + x + y*y + y + z*z + z) + 1'},
  {name: 'Kummer Quartic', equation: '(x*x + y*y + z*z - 1.69)^2 - 3.11 * ((1 - z)^2 - 2 * x*x) * ((1 + z)^2 - 2*y*y)'},
  {name: 'Barth Sextic', equation: '4 * (2.62 * x*x - y*y) * (2.62 * y*y - z*z) * (2.62 * z*z - x*x) - 4.24 * (x*x + y*y + z*z - 1)^2'},
  {name: 'Barth Decic', equation: '8 * (x*x - 6.85 * y*y) * (y*y - 6.85 * z*z) * (z*z - 6.85 * x*x) * (x^4 + y^4 + z^4 - 2 * x*x * y*y - 2 * x*x * z*z - 2 * y*y * z*z) + 11.1 * (x*x + y*y + z*z - 1)^2 * (x*x + y*y + z*z - 0.38)^2'},
  {name: 'Bretzel2', equation: '(((1 - x*x) * x*x - y*y)^2 + z*z / 2) / (1 + x*x + y*y + z*z) - 0.02'},
  {name: 'Bretzel5', equation: '((x*x + y*y / 4 - 1) * (x*x / 4 + y*y - 1))^2 + z*z / 2 - 0.08'},
  {name: 'Pilz', equation: '((x*x + y*y - 1)^2 + (z - 1)^2) * ((x^2 + (z - 0.3)^2 - 1)^2 + y*y) - 0.1'},
  {name: 'Orthocircles', equation: '((x*x + y*y - 1)^2 + z*z) * ((y*y + z*z - 1)^2 + x*x) * ((z*z + x*x - 1)^2 + y*y) - 0.02'},
  {name: 'DecoCube', equation: '((x*x + y*y - 0.64)^2 + (z*z - 1)^2) * ((y*y + z*z - 0.64)^2 + (x*x - 1)^2) * ((z*z + x*x - 0.64)^2 + (y*y - 1)^2) - 0.04'},
  {name: 'Borg Surface', equation: 'sin(x * y) + sin(y * z) + sin(z * x)'},
  {name: 'Tangle', equation: 'x*x * (x*x - 5) + y*y * (y*y - 5) + z*z * (z*z - 5) + 11.8'},
  {name: 'Chair', equation: '(x*x + y*y + z*z - 14.8)^2 - 0.8 * ((z - 4)^2 - 2 * x*x) * ((z + 4)^2 - 2 * y*y)'},
  {name: 'Devil Surface', equation: 'x^4 + 2 * x*x * z*z - 0.36 * x*x - y^4 + 0.25 * y*y + z^4'},
  {name: 'P1 Atomic orbital', equation: 'abs(x * exp(-0.5 * sqrt(x*x + y*y + z*z))) - 0.1'},
  {name: 'Tubey', equation: '-3 * x^8 - 3 * y^8 - 2 * z^8 + 5 * x^4 * y^2 * z^2 + 3 * x^2 * y^4 * z^2 - 4 * (x^3 + y^3 + z^3 + 1) + (x + y + z + 1)^4 + 1'},
  {name: 'The Blob', equation: 'x*x + y*y + z*z + sin(4*x) + sin(4*y) + sin(4*z) - 1'},
  {name: 'McMullen K3', equation: '(1 + x*x) * (1 + y*y) * (1 + z*z) + 8 * x * y * z - 2'},
  {name: 'Weird', equation: '25 * (x^3 * (y + z) + y^3 * (x + z) + z^3 * (x + y)) + 50 *(x*x * y*y + x*x * z*z + y*y * z*z) - 125 * (x*x * y * z + x * y*y * z + x * y * z*z) + 60 * x * y * z - 4 * (x * y + x * z + y * z)'},
  {name: 'Gerhard Miehlich', equation: '(z*z - 1)^2 - 2 * (x*x + y*y)'},
  {name: 'Kampyle of Eudoxus', equation: 'y*y + z*z - x^4 + x^2'},
  {name: 'Cayley Surface', equation: '-5 * (x*x * y + x*x * z + y*y * x + y*y * z + z*z * y + z*z * x) + 2 * (x * y + x * z + y * z)'},
  {name: 'Tooth Surface', equation: 'x^4 + y^4 + z^4 - (x*x + y*y + z*z)'},
  {name: 'Wiffle Cube', equation: '1 - (0.19 * (x*x + y*y + z*z))^-6 - (0.004 * (x^8 + y^8 + z^8))^6'},
  {name: 'Horned Cube', equation: '-3 * x^8 - 3 * y^8 - 2 * z^8 + 5 * x^4 * y*y * z*z + 3 * x*x * y^4 * z*z + 1'},
  {name: 'Lemnescate of Gerono', equation: 'x^4 - x*x + y*y + z*z'}
];
