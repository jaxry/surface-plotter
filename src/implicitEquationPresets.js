export default [
  {name: 'Cayley Cubic', equation: '4 * (x*x + y*y + z*z) + 16 * x * y * z - 1'},
  {name: 'Clebsch Cubic', equation: '81 * (x^3 + y^3 + z^3) - 189 * (x*x * (y + z) + y*y * (z + x) + z*z * (x + y)) + 54 * x*y*z + 126 * (x*y + y*z + z*x) - 9 * (x*x + x + y*y + y + z*z + z) + 1'},
  {name: 'Kummer Quartic', equation: '(x*x + y*y + z*z - 1.69)^2 - 3.11 * ((1 - z)^2 - 2 * x*x) * ((1 + z)^2 - 2*y*y)'},
  {name: 'Barth Sextic', equation: '4 * (2.62 * x*x - y*y) * (2.62 * y*y - z*z) * (2.62 * z*z - x*x) - 4.24 * (x*x + y*y + z*z - 1)^2'},
  {name: 'Bretzel2', equation: '(((1 - x*x) * x*x - y*y)^2 + z*z / 2) / (1 + x*x + y*y + z*z) - 0.02'},
  {name: 'Bretzel5', equation: '((x*x + y*y / 4 - 1) * (x*x / 4 + y*y - 1))^2 + z*z / 2 - 0.08'},
  {name: 'Pilz', equation: '((x*x + y*y - 1)^2 + (z - 1)^2) * ((x^2 + (z - 0.3)^2 - 1)^2 + y*y) - 0.1'},
  {name: 'Orthocircles', equation: '((x*x + y*y - 1)^2 + z*z) * ((y*y + z*z - 1)^2 + x*x) * ((z*z + x*x - 1)^2 + y*y) - 0.02'},
  {name: 'DecoCube', equation: '((x*x + y*y - 0.64)^2 + (z*z - 1)^2) * ((y*y + z*z - 0.64)^2 + (x*x - 1)^2) * ((z*z + x*x - 0.64)^2 + (y*y - 1)^2) - 0.04'}
];