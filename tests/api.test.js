const test = require('ava')
const fs = require('fs')
const path = require('path')
const { createTempDirectory } = require('create-temp-directory')
const util = require('util')
const createTorrent = util.promisify(require('create-torrent'))
const YAML = require('yaml')

const cleanTorrentDir = require('../lib/api')
const { createFiles } = require('./utils')

/**
 * @typedef {import('../lib/config').TorrentCleanConfig} TorrentCleanConfig
 */

test.beforeEach('Create temp directory', async (t) => {
  t.context.tempDir = await createTempDirectory()
})

test.afterEach.always('Remove temp directory', async (t) => {
  await t.context.tempDir.remove()
})

test('cleanTorrentDir » should throw if `torrentId` is not set', async (t) => {
  await t.throwsAsync(async () => cleanTorrentDir({ dirPath: './downloads' }), {
    message: `'torrentId' is required`,
  })
})

/**
 * Creates test torrent directory with files and configs
 *
 * @param {string} tempDirPath
 */
function createTestDir(tempDirPath) {
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
            edited: {
              'image1.jpg': '[binary]',
            },
          },
          '.torrent-cleanrc': '{ "ignore": ["**/edited/*"] }',
        },
      },
    },
    tempDirPath
  )
}

/**
 * Creates test torrent file
 */
async function createStubTorrent() {
  const file1 = Buffer.from('[binary]')
  file1.name = 'set1/image1.jpg'

  const file2 = Buffer.from('[binary]')
  file2.name = 'set2/image2.jpg'

  return createTorrent([file1, file2], {
    name: 'Nature Wallpapers',
  })
}

/**
 * @param {string} tempDirPath
 */
async function createTestContext(tempDirPath) {
  createTestDir(tempDirPath)

  const torrentId = await createStubTorrent()

  const dirPath = path.resolve(tempDirPath, 'downloads/images/nature')

  return {
    torrentId,
    dirPath,
    expectDeleted: ['set2/image2 (Copy).jpg'].map((filename) =>
      path.join(dirPath, filename)
    ),
    expectKept: [
      'set1/image1.jpg',
      'set1/~image1.jpg',
      'set2/image2.jpg',
      'edited/image1.jpg',
    ].map((filename) => path.join(dirPath, filename)),
  }
}

test('cleanTorrentDir » should clean directory from extra files', async (t) => {
  const { tempDir } = t.context

  const {
    torrentId,
    dirPath,
    expectDeleted,
    expectKept,
  } = await createTestContext(tempDir.path)

  await cleanTorrentDir({
    torrentId,
    dirPath,
    customConfig: { ignore: ['**/~*'] },
  })

  expectDeleted.forEach((filename) => {
    t.false(fs.existsSync(filename), `"${filename}" should not exist`)
  })

  expectKept.forEach((filename) => {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  })
})

test('cleanTorrentDir » should postpone files deleting if `dryRun` is set to `true`', async (t) => {
  const { tempDir } = t.context

  const {
    torrentId,
    dirPath,
    expectDeleted,
    expectKept,
  } = await createTestContext(tempDir.path)

  const { extraFiles, deleteFiles } = await cleanTorrentDir({
    torrentId,
    dirPath,
    dryRun: true,
    customConfig: { ignore: ['**/~*'] },
  })

  expectDeleted.forEach((filename) => {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  })

  expectKept.forEach((filename) => {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  })

  await deleteFiles(extraFiles)

  expectDeleted.forEach((filename) => {
    t.false(fs.existsSync(filename), `"${filename}" should not exist`)
  })

  expectKept.forEach((filename) => {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  })
})

test('cleanTorrentDir » should get `torrentId` from `lastTorrent` config property if `rememberLastTorrent` is set to `true`', async (t) => {
  const { tempDir } = t.context

  const {
    torrentId,
    dirPath,
    expectDeleted,
    expectKept,
  } = await createTestContext(tempDir.path)

  const torrentFilePath = path.join(
    tempDir.path,
    'downloads/nature-pack.torrent'
  )

  fs.writeFileSync(torrentFilePath, torrentId)

  fs.writeFileSync(
    path.join(tempDir.path, 'downloads', '.torrent-cleanrc'),
    JSON.stringify({
      rememberLastTorrent: true,
    })
  )

  fs.writeFileSync(
    path.join(dirPath, '.torrent-cleanrc'),
    JSON.stringify({ ignore: ['**/edited/*'], lastTorrent: torrentFilePath })
  )

  await cleanTorrentDir({
    dirPath,
    customConfig: { ignore: ['**/~*'] },
  })

  expectDeleted.forEach((filename) => {
    t.false(fs.existsSync(filename), `"${filename}" should not exist`)
  })

  expectKept.forEach((filename) => {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  })
})

test('cleanTorrentDir » should save `torrentId` to `lastTorrent` config  property if `rememberLastTorrent` is set to `true`', async (t) => {
  const { tempDir } = t.context

  const { torrentId, dirPath } = await createTestContext(tempDir.path)

  const torrentFilePath = path.join(
    tempDir.path,
    'downloads/nature-pack.torrent'
  )

  fs.writeFileSync(torrentFilePath, torrentId)

  fs.writeFileSync(
    path.join(tempDir.path, 'downloads', '.torrent-cleanrc'),
    JSON.stringify({
      rememberLastTorrent: true,
    })
  )

  await cleanTorrentDir({
    torrentId: torrentFilePath,
    dirPath,
    customConfig: { ignore: ['**/~*'] },
  })

  /** @type {TorrentCleanConfig} */
  const savedConfig = YAML.parse(
    fs.readFileSync(path.resolve(dirPath, '.torrent-cleanrc')).toString()
  )

  t.assert(savedConfig.lastTorrent === torrentFilePath)
})
