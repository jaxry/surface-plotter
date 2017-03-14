export default {
  entry: 'src/main',
  dest: 'public/dist.js',
  external: [
    'gl-matrix'
  ],
  globals: {
    'gl-matrix': 'window'
  },
  format: 'iife'
};