const fs = require('fs')
const util = require('util')
const unlink = util.promisify(fs.unlink)
const deleteEmpty = require('delete-empty')

const logColor = require('./log-color')

async function deleteFiles(filenames) {
  try {
    const deletePromises = filenames.map((filename) => unlink(filename))
    await Promise.all(deletePromises)
  } catch (error) {
    console.log(logColor.error('Cannot delete files'), error)
  }
}

async function deleteEmptyFolders(dirPath) {
  try {
    await deleteEmpty(dirPath)
  } catch (error) {
    console.log(logColor.error('Cannot delete empty directories'), error)
  }
}

module.exports = async function deleteFilesAndEmptyFolders(filenames, dirPath) {
  await deleteFiles(filenames)
  await deleteEmptyFolders(dirPath)
}
