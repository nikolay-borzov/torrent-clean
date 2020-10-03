const path = require('path')

const { loadConfig, saveConfig } = require('./config')
const { getTorrentMetadata } = require('./parse-torrent')
const { readDir } = require('./read-dir')
const { deleteFilesAndEmptyDirs } = require('./delete-files')

/**
 * @typedef {import('./config').TorrentCleanConfig} TorrentCleanConfig
 * @typedef {import('./config').LoadConfigResult} LoadConfigResult
 * @typedef {import('./parse-torrent').TorrentId} TorrentId
 */

/**
 * @typedef {object} TorrentCleanOptions
 * @property {TorrentId} [torrentId] Torrent ID
 * (as described in {@link https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-|webtorrent api}).
 * If empty `lastTorrent` value from [config]{@link TorrentCleanConfig} is used
 * (only when `rememberLastTorrent` is `true`)
 * @property {string} dirPath Path to directory with downloaded files
 * @property {boolean} [dryRun] Postpone deleting files until confirm function
 * is called
 * @property {TorrentCleanConfig} [customConfig] Config that will be merged with
 * configs collected from files
 * @property {(torrentId: TorrentId) => void} [onConfigLoaded] Called when
 * config is parsed
 */

/**
 * @typedef {object} TorrentCleanResult
 * @property {string} torrentName Parsed torrent name
 * @property {string[]} extraFiles Extra files' paths
 * @property {(files: string[]) => Promise<void>} [deleteFiles] Function to
 * delete files in the directory. Only set if `dryRun` is set to `true`
 */

/**
 * Parses `torrentId`, finds and deletes files inside `dirPath` not listed
 * in the torrent.
 *
 * @param {TorrentCleanOptions} options
 * @returns {Promise<TorrentCleanResult>}
 */
async function cleanTorrentDir({
  torrentId,
  dirPath,
  customConfig,
  dryRun,
  onConfigLoaded,
}) {
  /** @type {LoadConfigResult} */
  let loadConfigResult

  try {
    loadConfigResult = await loadConfig(dirPath, customConfig)
  } catch (error) {
    error.message = `Cannot parse config file ${error.message}`
    throw error
  }

  const { config, searchFromCosmiconfigResult } = loadConfigResult

  // Use `lastTorrent` only if `rememberLastTorrent` is enabled
  if (!torrentId && config.rememberLastTorrent) {
    torrentId = config.lastTorrent
  }

  if (!torrentId) {
    throw new Error(`'torrentId' is required`)
  }

  if (onConfigLoaded) {
    onConfigLoaded(torrentId)
  }

  return Promise.all([
    getTorrentMetadata(torrentId),
    readDir(dirPath, config.ignore),
  ]).then(async ([parseResult, dirFiles]) => {
    if (!parseResult) {
      throw new Error('Unable to parse torrent')
    }

    const { name, files } = parseResult

    // Get absolute paths of torrent files
    const torrentFiles = files.map((file) =>
      path.join(dirPath, file).toLowerCase()
    )

    // Get files not listed in the torrent
    const extraFiles = dirFiles.filter(
      (filename) => torrentFiles.indexOf(filename.toLowerCase()) === -1
    )

    if (!dryRun) {
      await deleteFilesAndEmptyDirs(dirPath, extraFiles)
    }

    if (config.rememberLastTorrent && typeof torrentId === 'string') {
      const { config: searchFromConfig = {}, filepath } =
        searchFromCosmiconfigResult || {}

      saveConfig({
        config: {
          ...searchFromConfig,
          lastTorrent: torrentId,
        },
        saveDirPath: dirPath,
        ...(filepath && { existingConfigPath: filepath }),
      })
    }

    return {
      torrentName: name,
      extraFiles,
      ...(dryRun && {
        deleteFiles: deleteFilesAndEmptyDirs.bind(null, dirPath),
      }),
    }
  })
}

module.exports = cleanTorrentDir
