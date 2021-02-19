module.exports = {
  '**/*.?(c)js': (filenames) => [
    `eslint --cache --fix ${filenames.join(' ')}`,
    'ava',
  ],
  '**/*.*': 'prettier --write --ignore-unknown',
}
