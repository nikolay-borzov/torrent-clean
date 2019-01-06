module.exports = {
  parser: 'babel-eslint',
  root: true,
  env: {
    node: true,
  },
  plugins: ['prettier', 'standard'],
  extends: [
    'standard',
    'prettier',
    'plugin:prettier/recommended',
    'prettier/standard'
  ]
}
