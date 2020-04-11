const test = require('ava')
const fs = require('fs')
const path = require('path')
const { createTempDirectory } = require('create-temp-directory')
const util = require('util')
const createTorrent = util.promisify(require('create-torrent'))

const { cleanTorrentDir } = require('../lib/api')
const { createFiles } = require('./utils')

test.beforeEach('Create temp directory', async (t) => {
  t.context.tempDir = await createTempDirectory()
})

test.afterEach.always('Remove temp directory', async (t) => {
  await t.context.tempDir.remove()
})

test('cleanTorrentDir » should clean directory from extra files', async (t) => {
  const { tempDir } = t.context

  const directoryPath = path.resolve(tempDir.path, 'download/images/nature')

  createFiles(
    {
      download: {
        images: {
          nature: {
            set1: {
              'image1.jpg': '[binary]',
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
    tempDir.path
  )

  const file1 = Buffer.from('[binary]')
  file1.name = 'set1/image1.jpg'

  const file2 = Buffer.from('[binary]')
  file2.name = 'set2/image2.jpg'

  const torrentId = await createTorrent([file1, file2], {
    name: 'Nature Wallpapers',
  })

  await cleanTorrentDir({ torrentId, directoryPath })

  const expectDeleted = ['set2/image2 (Copy).jpg'].map((filename) =>
    path.join(directoryPath, filename)
  )

  expectDeleted.forEach((filename) => {
    t.false(fs.existsSync(filename), `"${filename}" should not exist`)
  })

  const expectKept = [
    'set1/image1.jpg',
    'set2/image2.jpg',
    'edited/image1.jpg',
  ].map((filename) => path.join(directoryPath, filename))

  expectKept.forEach((filename) => {
    t.true(fs.existsSync(filename), `"${filename}" should exist`)
  })
})
