const test = require('ava')
const { createTempDirectory } = require('create-temp-directory')
const path = require('path')

const { loadConfig } = require('../lib/config-loader')
const { createFiles } = require('./utils')

test.beforeEach('Create temp directory', async (t) => {
  t.context.tempDir = await createTempDirectory()
})

test.afterEach.always('Remove temp directory', async (t) => {
  await t.context.tempDir.remove()
})

/** @type {import('../lib/config-loader').TorrentCleanConfig} */
const DEFAULT_CONFIG = {
  ignore: ['~uTorrentPartFile*', '.torrent-cleanrc*'],
}

test('loadConfig » should return default config if no config files found', (t) => {
  const { tempDir } = t.context

  const actual = loadConfig(tempDir.path)

  t.deepEqual(actual, DEFAULT_CONFIG)
})

test('loadConfig » should collect and merge configs up to root directory', (t) => {
  const expected = {
    ignore: [...DEFAULT_CONFIG.ignore, '*(Copy)*', 'Thumbs.db', '~*'],
    dryRun: true,
  }

  const { tempDir } = t.context

  createFiles(
    {
      download: {
        images: {
          nature: {
            'image1.jpg': '[binary]',
            'image2.jpg': '[binary]',
            'image2 (Copy).jpg': '[binary]',
            'Thumbs.db': '[binary]',
            '.torrent-cleanrc': '{ "ignore": ["*(Copy)*"], "dryRun": true }',
          },
          '.torrent-cleanrc.json':
            '{ "ignore": ["Thumbs.db"], "dryRun": false }',
        },
        '.torrent-cleanrc': '{ "ignore": ["~*"], "dryRun": false }',
      },
    },
    tempDir.path
  )

  const actual = loadConfig(path.join(tempDir.path, '/download/images/nature'))

  t.deepEqual(actual, expected)
})

test('loadConfig » should accept config object', (t) => {
  const expected = {
    ignore: [...DEFAULT_CONFIG.ignore, 'walkthrough.txt', '~*'],
    dryRun: true,
  }

  const { tempDir } = t.context

  createFiles(
    {
      game: {
        'game.exe': '[binary]',
        'data.dat': '[binary]',
        '.torrent-cleanrc': '{ "ignore": ["~*"], "dryRun": false }',
      },
    },
    tempDir.path
  )

  const actual = loadConfig(path.join(tempDir.path, 'game'), {
    ignore: ['walkthrough.txt'],
    dryRun: true,
  })

  t.deepEqual(actual, expected)
})
