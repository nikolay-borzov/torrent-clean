const path = require('path')

const { loadConfig } = require('./load-config')
const { getTorrentMetadata } = require('./parse-torrent')
const { readDir } = require('./read-dir')
const { deleteFilesAndEmptyDirs } = require('./delete-files')

/**
 * @typedef {import('./load-config').TorrentCleanConfig} TorrentCleanConfig
 * @typedef {import('./parse-torrent').TorrentId} TorrentId
 */

/**
 * @typedef {object} TorrentCleanOptions
 * @property {TorrentId} torrentId Torrent id
 * (as described in {@link https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-|webtorrent api})
 * @property {string} directoryPath Path to directory with downloaded files
 * @property {TorrentCleanConfig} [customConfig] Config that will be merged with
 * configs collected from files
 */

/**
 * @typedef {object} TorrentCleanResult
 * @property {string[]} extraFiles Extra files' paths
 * @property {(files: string[]) => Promise<void>} [deleteFiles] Function to
 * delete files in the directory. Only set if `dryRun` is set to `true`
 */

/**
 * Parses `torrentId` and finds files inside `directoryPath` not listed in the torrent.
 *
 * @param {TorrentCleanOptions} options
 * @returns {Promise<TorrentCleanResult>}
 */
async function cleanTorrentDir({ torrentId, directoryPath, customConfig }) {
  /** @type {TorrentCleanConfig} */
  let config

  try {
    config = loadConfig(directoryPath, customConfig)
  } catch (error) {
    error.message = `Cannot parse config file ${error.message}`
    throw error
  }

  return Promise.all([
    getTorrentMetadata(torrentId),
    readDir(directoryPath, config.ignore),
  ]).then(async ([parseResult, dirFiles]) => {
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

    if (!config.dryRun) {
      await deleteFilesAndEmptyDirs(directoryPath, extraFiles)
    }

    return {
      extraFiles,
      ...(config.dryRun && {
        deleteFiles: deleteFilesAndEmptyDirs.bind(null, directoryPath),
      }),
    }
  })
}

module.exports = cleanTorrentDir
