const path = require('path')
const recursive = require('recursive-readdir')

const loadConfig = require('./config-loader')
const parseTorrent = require('./parse-torrent')
const deleteFilesAndEmptyFolders = require('./delete-files')

/**
 * @typedef {import('./config-loader').TorrentCleanConfig} TorrentCleanConfig
 */

/**
 * @typedef {object} TorrentCleanOptions
 * @property {string} torrentId Torrent id
 * (as described in {@link https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-|webtorrent api})
 * @property {string} directoryPath Path to directory with downloaded files
 * @property {TorrentCleanConfig} [customConfig] Config that will be merged with
 * configs collected from files
 */

/**
 * @typedef {object} TorrentCleanResult
 * @property {string[]} extraFiles Extra files' paths
 * @property {(files: string[]) => Promise<void>} deleteFiles Function to delete files in the directory
 */

/**
 * Parses `torrentId` and finds files inside `directoryPath` not listed in the torrent.
 *
 * @param {TorrentCleanOptions} options
 * @returns {Promise<TorrentCleanResult>}
 */
async function cleanTorrentDirectory({
  torrentId,
  directoryPath,
  customConfig,
}) {
  /** @type {TorrentCleanConfig} */
  let config

  try {
    config = loadConfig(directoryPath, customConfig)
  } catch (error) {
    error.message = `Cannot parse config file ${error.message}`
    throw error
  }

  return Promise.all([
    parseTorrent(torrentId),
    recursive(directoryPath, config.ignore),
  ]).then(([parseResult, dirFiles]) => {
    if (!parseResult) {
      throw new Error('Unable to parse torrent')
    }

    const { name, files } = parseResult

    const rootDir = `${name}${path.sep}`
    // Get absolute paths of torrent files
    const torrentFiles = files.map((file) =>
      path.join(directoryPath, file.replace(rootDir, ''))
    )

    // Get files not listed in the torrent
    const extraFiles = dirFiles.filter(
      (filename) => torrentFiles.indexOf(filename) === -1
    )

    return {
      extraFiles,
      deleteFiles(files) {
        return deleteFilesAndEmptyFolders(files, directoryPath)
      },
    }
  })
}

module.exports = cleanTorrentDirectory
