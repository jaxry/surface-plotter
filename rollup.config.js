export default {
  input: 'src/main.js',
  output: {
    file:'public/dist.js',
    format: 'iife'
  },
  globals: {
    three: 'THREE'
  },
  external: [
    'three'
  ],
};
