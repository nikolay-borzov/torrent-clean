module.exports = {
  '**/*.?(c)js': (filenames) => [
    `eslint --cache --fix ${filenames.join(' ')}`,
    'ava --fail-fast',
  ],
  // Format supported non JavaScript files
  '**/*.!(?(c)js)': 'prettier --write --ignore-unknown',
}
