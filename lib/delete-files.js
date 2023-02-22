import fs from 'node:fs'
import { promisify } from 'node:util'

import deleteEmpty from 'delete-empty'

import * as logColor from './log-color.js'

const unlink = promisify(fs.unlink)

/**
 * @param {string[]} filenames
 */
async function deleteFiles(filenames) {
  try {
    const deletePromises = filenames.map((filename) => unlink(filename))

    await Promise.all(deletePromises)
  } catch (error) {
    console.log(logColor.error('Cannot delete files'), error)
  }
}

/**
 * @param {string} directoryPath
 */
async function deleteEmptyDirectories(directoryPath) {
  try {
    await deleteEmpty(directoryPath)
  } catch (error) {
    console.log(logColor.error('Cannot delete empty directories'), error)
  }
}

/**
 * @param {string} directoryPath
 * @param {string[]} filenames
 */
export async function deleteFilesAndEmptyDirectories(directoryPath, filenames) {
  await deleteFiles(filenames)
  await deleteEmptyDirectories(directoryPath)
}
