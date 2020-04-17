module.exports = {
  '**/*.js': filenames => [`eslint ${filenames.join(' ')}`, 'ava']
}
