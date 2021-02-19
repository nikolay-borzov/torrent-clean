import test from 'ava'
import fs from 'fs'
import path from 'path'
import { createTempDirectory } from 'create-temp-directory'
import { promisify } from 'util'
import YAML from 'yaml'
import createTorrentCallback from 'create-torrent'

import cleanTorrentDirectory from '../lib/api.js'
import { createFiles } from './utils.js'

const createTorrent = promisify(createTorrentCallback)

/**
 * @typedef {import('../lib/config').TorrentCleanConfig} TorrentCleanConfig
 */

test.beforeEach('Create temp directory', async (t) => {
  t.context.tempDir = await createTempDirectory()
})

test.afterEach.always('Remove temp directory', async (t) => {
  await t.context.tempDir.remove()
})

test('cleanTorrentDirectory » should throw if `torrentId` is not set', async (t) => {
  await t.throwsAsync(
    async () => cleanTorrentDirectory({ directoryPath: './downloads' }),
    {
      message: `'torrentId' is required`,
    }
  )
})

/**
 * Creates test torrent directory with files and configs.
 *
 * @param {string} temporaryDirectoryPath
 */
function createTestDirectory(temporaryDirectoryPath) {
  createFiles(
    {
      downloads: {
        images: {
          nature: {
            set1: {
              'image1.jpg': '[binary]',
              '~image1.jpg': '[binary]',
            },
            set2: {
              'image2.jpg': '[binary]',
              'image2 (Copy).jpg': '[binary]',
            },
            Set3: {
              'image3.jpg': '[binary]',
            },
            '.edited': {
              'image1.jpg': '[binary]',
            },
          },
          '.torrent-cleanrc': '{ "ignore": [".edited/*"] }',
        },
      },
    },
    temporaryDirectoryPath
  )
}

/**
 * Creates test torrent file.
 *
 * @returns {Promise<Buffer>}
 */
async function createStubTorrent() {
  const file1 = Buffer.from('[binary]')
  const file2 = Buffer.from('[binary]')
  const file3 = Buffer.from('[binary]')

  file1.name = 'set1/image1.jpg'
  file2.name = 'set2/image2.jpg'
  file3.name = 'set3/image3.jpg'

  return createTorrent([file1, file2, file3])
}

/**
 * @typedef {object} TestContext
 * @property {Buffer} torrentId
 * @property {string} directoryPath
 * @property {string[]} expectDeleted
 * @property {string[]} expectKept
 */

/**
 * @param {string} temporaryDirectoryPath
 * @returns {Promise<TestContext>}
 */
async function createTestContext(temporaryDirectoryPath) {
  createTestDirectory(temporaryDirectoryPath)

  const torrentId = await createStubTorrent()

  const directoryPath = path.resolve(
    temporaryDirectoryPath,
    'downloads/images/nature'
  )

  return {
    torrentId,
    directoryPath: directoryPath,
    expectDeleted: ['set2/image2 (Copy).jpg'].map((filename) =>
      path.join(directoryPath, filename)
    ),
    expectKept: [
      'set1/image1.jpg',
      'set1/~image1.jpg',
      'set2/image2.jpg',
      '.edited/image1.jpg',
    ].map((filename) => path.join(directoryPath, filename)),
  }
}

test('cleanTorrentDirectory » should clean directory from extra files', async (t) => {
  const { tempDir } = t.context

  const {
    torrentId,
    directoryPath,
    expectDeleted,
    expectKept,
  } = await createTestContext(tempDir.path)

  await cleanTorrentDirectory({
    torrentId,
    directoryPath,
    customConfig: { ignore: ['**/~*'] },
  })

  for (const filename of expectDeleted) {
    t.false(fs.existsSync(filename), `"${filename}" should not exist`)
  }

  for (const filename of expectKept) {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  }
})

test('cleanTorrentDirectory » should ignore filename path case', async (t) => {
  const { tempDir } = t.context

  const { torrentId, directoryPath } = await createTestContext(tempDir.path)

  const expectKept = path.join(directoryPath, 'Set3/image3.jpg')

  await cleanTorrentDirectory({
    torrentId,
    directoryPath,
  })

  t.true(fs.existsSync(expectKept), `"${expectKept}" should exist`)
})

test('cleanTorrentDirectory » should postpone files deleting if `dryRun` is set to `true`', async (t) => {
  const { tempDir } = t.context

  const {
    torrentId,
    directoryPath,
    expectDeleted,
    expectKept,
  } = await createTestContext(tempDir.path)

  const { extraFiles, deleteFiles } = await cleanTorrentDirectory({
    torrentId,
    directoryPath,
    dryRun: true,
    customConfig: { ignore: ['**/~*'] },
  })

  for (const filename of expectDeleted) {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  }

  for (const filename of expectKept) {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  }

  await deleteFiles(extraFiles)

  for (const filename of expectDeleted) {
    t.false(fs.existsSync(filename), `"${filename}" should not exist`)
  }

  for (const filename of expectKept) {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  }
})

test('cleanTorrentDirectory » should get `torrentId` from `lastTorrent` config property if `rememberLastTorrent` is set to `true`', async (t) => {
  const { tempDir } = t.context

  const {
    torrentId,
    directoryPath,
    expectDeleted,
    expectKept,
  } = await createTestContext(tempDir.path)

  const torrentFilePath = path.join(
    tempDir.path,
    'downloads/nature-pack.torrent'
  )

  fs.writeFileSync(torrentFilePath, torrentId)

  fs.writeFileSync(
    path.join(tempDir.path, 'downloads', '.torrent-cleanrc.json'),
    JSON.stringify({
      rememberLastTorrent: true,
    })
  )

  fs.writeFileSync(
    path.join(directoryPath, '.torrent-cleanrc.json'),
    JSON.stringify({ ignore: ['**/edited/*'], lastTorrent: torrentFilePath })
  )

  await cleanTorrentDirectory({
    directoryPath,
    customConfig: { ignore: ['**/~*'] },
  })

  for (const filename of expectDeleted) {
    t.false(fs.existsSync(filename), `"${filename}" should not exist`)
  }

  for (const filename of expectKept) {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  }
})

test('cleanTorrentDirectory » should save `torrentId` to `lastTorrent` config  property if `rememberLastTorrent` is set to `true`', async (t) => {
  const { tempDir } = t.context

  const { torrentId, directoryPath } = await createTestContext(tempDir.path)

  const torrentFilePath = path.join(
    tempDir.path,
    'downloads/nature-pack.torrent'
  )

  fs.writeFileSync(torrentFilePath, torrentId)

  fs.writeFileSync(
    path.join(tempDir.path, 'downloads', '.torrent-cleanrc.json'),
    JSON.stringify({
      rememberLastTorrent: true,
    })
  )

  await cleanTorrentDirectory({
    torrentId: torrentFilePath,
    directoryPath,
    customConfig: { ignore: ['**/~*'] },
  })

  /** @type {TorrentCleanConfig} */
  const savedConfig = YAML.parse(
    fs.readFileSync(path.resolve(directoryPath, '.torrent-cleanrc')).toString()
  )

  t.assert(savedConfig.lastTorrent === torrentFilePath)
})
