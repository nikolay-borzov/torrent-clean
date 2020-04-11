const fs = require('fs')
const util = require('util')
const unlink = util.promisify(fs.unlink)
const deleteEmpty = require('delete-empty')

const logColor = require('./log-color')

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
 * @param {string} dirPath
 */
async function deleteEmptyDirs(dirPath) {
  try {
    await deleteEmpty(dirPath)
  } catch (error) {
    console.log(logColor.error('Cannot delete empty directories'), error)
  }
}

/**
 * @param {string} dirPath
 * @param {string[]} filenames
 */
exports.deleteFilesAndEmptyDirs = async function deleteFilesAndEmptyDirs(
  dirPath,
  filenames
) {
  await deleteFiles(filenames)
  await deleteEmptyDirs(dirPath)
}
