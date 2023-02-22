// eslint-disable-next-line import/no-default-export -- It's okay for a config
export default {
  '*.{js,cjs}': (filenames) => [
    `eslint --cache --fix ${filenames.join(' ')}`,
    'ava --fail-fast',
  ],
  // Format supported non JavaScript files
  '!(*.{js,cjs})': 'prettier --write --ignore-unknown',
}
