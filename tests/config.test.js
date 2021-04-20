import test from 'ava'
import { createTempDirectory } from 'create-temp-directory'
import path from 'path'
import fs from 'fs'
import YAML from 'yaml'

import { loadConfig, saveConfig } from '../lib/config.js'
import { createFiles } from './utils.js'

/**
 * @typedef {import('ava').ExecutionContext} ExecutionContext
 * @typedef {import('../lib/config').TorrentCleanConfig} TorrentCleanConfig
 */

test.beforeEach('Create temp directory', async (t) => {
  t.context.tempDir = await createTempDirectory()
})

test.afterEach.always('Remove temp directory', async (t) => {
  await t.context.tempDir.remove()
})

/** @type {TorrentCleanConfig} */
const DEFAULT_CONFIG = {
  ignore: ['~uTorrentPartFile*', '.torrent-cleanrc*'],
}

test('loadConfig » should return default config if no config files found', async (t) => {
  const { tempDir } = t.context

  const actual = await loadConfig(tempDir.path)

  t.deepEqual(actual, { config: DEFAULT_CONFIG })
})

test('loadConfig » should collect and merge configs up to root directory', async (t) => {
  const { tempDir } = t.context

  const expected = {
    config: {
      ignore: [...(DEFAULT_CONFIG.ignore || []), '*(Copy)*', 'Thumbs.db', '~*'],
      rememberLastTorrent: true,
    },
    searchFromCosmiconfigResult: {
      config: { ignore: ['*(Copy)*'], rememberLastTorrent: true },
      filepath: path.join(
        tempDir.path,
        'download/images/nature/.torrent-cleanrc'
      ),
    },
  }

  createFiles(
    {
      download: {
        images: {
          nature: {
            'image1.jpg': '[binary]',
            'image2.jpg': '[binary]',
            'image2 (Copy).jpg': '[binary]',
            'Thumbs.db': '[binary]',
            '.torrent-cleanrc':
              '{ "ignore": ["*(Copy)*"], "rememberLastTorrent": true }',
          },
          '.torrent-cleanrc.json':
            '{ "ignore": ["Thumbs.db"], "rememberLastTorrent": false }',
        },
        '.torrent-cleanrc':
          '{ "ignore": ["~*"], "rememberLastTorrent": false }',
      },
    },
    tempDir.path
  )

  const actual = await loadConfig(
    path.join(tempDir.path, '/download/images/nature')
  )

  t.deepEqual(actual, expected)
})

test('loadConfig » should accept config object', async (t) => {
  const { tempDir } = t.context

  const expected = {
    config: {
      ignore: [...(DEFAULT_CONFIG.ignore || []), 'walkthrough.txt', '~*'],
      rememberLastTorrent: true,
    },
    searchFromCosmiconfigResult: {
      config: { ignore: ['~*'], rememberLastTorrent: false },
      filepath: path.join(tempDir.path, 'game/.torrent-cleanrc'),
    },
  }

  createFiles(
    {
      game: {
        'game.exe': '[binary]',
        'data.dat': '[binary]',
        '.torrent-cleanrc':
          '{ "ignore": ["~*"], "rememberLastTorrent": false }',
      },
    },
    tempDir.path
  )

  const actual = await loadConfig(path.join(tempDir.path, 'game'), {
    ignore: ['walkthrough.txt'],
    rememberLastTorrent: true,
  })

  t.deepEqual(actual, expected)
})

test('saveConfig » should create config at `saveDirectoryPath` if it does not exist', (t) => {
  const { tempDir } = t.context

  /** @type {TorrentCleanConfig} */
  const config = { lastTorrent: 'C:/downloads/nature-pack.torrent', ignore: [] }
  const saveDirectoryPath = path.join(tempDir.path, 'path/to/dir')
  const filename = path.join(saveDirectoryPath, '.torrent-cleanrc.yaml')

  createFiles(
    {
      path: {
        to: {
          dir: {},
        },
      },
    },
    tempDir.path
  )

  saveConfig({
    config,
    saveDirectoryPath,
  })

  const fileContent = fs.readFileSync(filename).toString()

  t.snapshot(fileContent)
})

/**
 * @param {ExecutionContext} t
 * @param {object} params
 * @param {string} params.filename
 * @param {(config: TorrentCleanConfig) => string} params.getFileContent
 */
function saveConfigUpdateFileMacro(t, { filename, getFileContent }) {
  const { tempDir } = t.context

  /** @type {TorrentCleanConfig} */
  const config = {
    ignore: ['~*'],
    lastTorrent: 'C:/downloads/nature-pack.torrent',
  }
  const saveDirectoryPath = path.join(tempDir.path, 'downloads')
  const existingConfigPath = path.join(saveDirectoryPath, filename)

  createFiles(
    {
      downloads: {
        [filename]: getFileContent(config),
      },
    },
    tempDir.path
  )

  saveConfig({
    config,
    saveDirectoryPath: saveDirectoryPath,
    existingConfigPath,
  })

  const fileContent = fs.readFileSync(existingConfigPath).toString()

  t.snapshot(fileContent)
}

test(
  'saveConfig » should update existing config `.json` file',
  saveConfigUpdateFileMacro,
  {
    filename: '.torrent-cleanrc.json',
    getFileContent: (config) => JSON.stringify(config),
  }
)

test(
  'saveConfig » should update existing config `.yaml` file',
  saveConfigUpdateFileMacro,
  {
    filename: '.torrent-cleanrc.yaml',
    getFileContent: (config) => YAML.stringify(config),
  }
)

test(
  'saveConfig » should update existing config `.yml` file',
  saveConfigUpdateFileMacro,
  {
    filename: '.torrent-cleanrc.yml',
    getFileContent: (config) => YAML.stringify(config),
  }
)

test(
  'saveConfig » should update existing config JSON file w/o extension',
  saveConfigUpdateFileMacro,
  {
    filename: '.torrent-cleanrc',
    getFileContent: (config) => JSON.stringify(config),
  }
)

test(
  'saveConfig » should update existing config YAML file w/o extension',
  saveConfigUpdateFileMacro,
  {
    filename: '.torrent-cleanrc',
    getFileContent: (config) => YAML.stringify(config),
  }
)
