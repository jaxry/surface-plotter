export default {
  entry: 'src/main',
  dest: 'public/dist.js',
  globals: {
    three: 'THREE'
  },
  external: [
    'three'
  ],
  format: 'iife'
};