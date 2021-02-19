import path from 'path'

import { loadConfig, saveConfig } from './config.js'
import { getTorrentMetadata } from './parse-torrent.js'
import { readDirectory } from './read-directory.js'
import { deleteFilesAndEmptyDirectories } from './delete-files.js'

/**
 * @typedef {import('./config').TorrentCleanConfig} TorrentCleanConfig
 * @typedef {import('./config').LoadConfigResult} LoadConfigResult
 * @typedef {import('./parse-torrent').TorrentId} TorrentId
 */

/**
 * @typedef {object} TorrentCleanOptions
 * @property {TorrentId} [torrentId] Torrent ID
 * (as described in {@link https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-}).
 * If empty `lastTorrent` value from [config]{@link TorrentCleanConfig} is used
 * (only when `rememberLastTorrent` is `true`).
 * @property {string} directoryPath Path to directory with downloaded files.
 * @property {boolean} [dryRun] Postpone deleting files until confirm function
 * is called.
 * @property {TorrentCleanConfig} [customConfig] Config that will be merged with
 * configs collected from files.
 * @property {(torrentId: TorrentId) => void} [onConfigLoaded] Called when
 * config is parsed.
 */

/**
 * @typedef {object} TorrentCleanResult
 * @property {string} torrentName Parsed torrent name.
 * @property {string[]} extraFiles Extra files' paths.
 * @property {(files: string[]) => Promise<void>} deleteFiles Function to
 * delete files in the directory. Has effect only if `dryRun` is set to `true`.
 */

/**
 * Parses `torrentId`, finds and deletes files inside `directoryPath` not listed
 * in the torrent.
 *
 * @param {TorrentCleanOptions} options
 * @returns {Promise<TorrentCleanResult>}
 */
export async function cleanTorrentDirectory({
  torrentId,
  directoryPath,
  customConfig,
  dryRun,
  onConfigLoaded,
}) {
  /** @type {LoadConfigResult} */
  let loadConfigResult

  try {
    loadConfigResult = await loadConfig(directoryPath, customConfig)
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
    readDirectory(directoryPath, config.ignore),
  ]).then(async ([parseResult, directoryFiles]) => {
    if (!parseResult) {
      throw new Error('Unable to parse torrent')
    }

    const { name, files } = parseResult

    // Get absolute paths of torrent files
    const torrentFiles = new Set(
      files.map((file) => path.join(directoryPath, file).toLowerCase())
    )

    // Get files not listed in the torrent
    const extraFiles = directoryFiles.filter(
      (filename) => !torrentFiles.has(filename.toLowerCase())
    )

    if (!dryRun) {
      await deleteFilesAndEmptyDirectories(directoryPath, extraFiles)
    }

    if (config.rememberLastTorrent && typeof torrentId === 'string') {
      const { config: searchFromConfig = {}, filepath } =
        searchFromCosmiconfigResult || {}

      saveConfig({
        config: {
          ...searchFromConfig,
          lastTorrent: torrentId,
        },
        saveDirectoryPath: directoryPath,
        ...(filepath && { existingConfigPath: filepath }),
      })
    }

    return {
      torrentName: name,
      extraFiles,
      deleteFiles: dryRun
        ? deleteFilesAndEmptyDirectories.bind(undefined, directoryPath)
        : async () => {},
    }
  })
}

// eslint-disable-next-line import/no-default-export -- Additional main export for convenience
export default cleanTorrentDirectory
