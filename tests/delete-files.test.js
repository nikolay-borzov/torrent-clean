import test from 'ava'
import { createTempDirectory } from 'create-temp-directory'
import fs from 'node:fs'
import path from 'node:path'

import { deleteFilesAndEmptyDirectories } from '../lib/delete-files.js'
import { createFiles } from './utils.js'

test.beforeEach('Create temp directory', async (t) => {
  t.context.tempDir = await createTempDirectory()
})

test.afterEach.always('Remove temp directory', async (t) => {
  await t.context.tempDir.remove()
})

test('deleteFilesAndEmptyDirectories » should delete specified files and empty directories', async (t) => {
  const { tempDir } = t.context

  createFiles(
    {
      images: {
        nature: {
          'image1.jpg': '[binary]',
          'image2.jpg': '[binary]',
          'image2 (Copy).jpg': '[binary]',
          'Thumbs.db': '[binary]',
        },
        tmp: {},
      },
    },
    tempDir.path
  )

  await deleteFilesAndEmptyDirectories(tempDir.path, [
    path.resolve(tempDir.path, 'images/nature/image2 (Copy).jpg'),
    path.resolve(tempDir.path, 'images/nature/Thumbs.db'),
  ])

  const expectDeleted = [
    'images/nature/image2 (Copy).jpg',
    'images/nature/Thumbs.db',
    'images/tmp',
  ].map((filename) => path.join(tempDir.path, filename))

  for (const filename of expectDeleted) {
    t.falsy(fs.existsSync(filename), `${filename} should not exist`)
  }

  const expectKept = [
    'images/nature/image1.jpg',
    'images/nature/image2.jpg',
  ].map((filename) => path.join(tempDir.path, filename))

  for (const filename of expectKept) {
    t.truthy(fs.existsSync(filename), `${filename} should exist`)
  }
})
