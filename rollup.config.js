import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/main',
  dest: 'public/dist.js',
  globals: {
    three: 'THREE'
  },
  external: [
    'three'
  ],
  // plugins: [
  //   nodeResolve({})
  // ],
  format: 'iife'
};