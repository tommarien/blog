const postcss = require('rollup-plugin-postcss');
const replace = require('@rollup/plugin-replace');
const svg = require('rollup-plugin-svg');
const { terser } = require('rollup-plugin-terser');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  input: 'src/scripts/main.js',
  output: {
    sourcemap: false,
    format: 'iife',
    name: 'main',
    file: 'dist/assets/main.bundle.js',
  },
  plugins: [
    replace({
      preventAssignment: true,
      DEV_MODE: dev,
    }),
    svg(),
    postcss({
      extract: path.resolve('dist/assets/main.bundle.css'),
      minimize: !dev,
    }),
    !dev && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
