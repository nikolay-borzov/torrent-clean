module.exports = {
  parser: 'babel-eslint',
  root: true,
  env: {
    node: true,
  },
  plugins: ['prettier', 'standard', 'jsdoc'],
  extends: [
    'standard',
    'prettier',
    'plugin:prettier/recommended',
    'prettier/standard',
    'plugin:jsdoc/recommended'
  ],
  'settings': {
    'jsdoc': {
      'mode': 'typescript'
    }
  },
  rules: {
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns-description': 'off'
  }
}
