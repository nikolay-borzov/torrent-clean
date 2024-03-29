import fs from 'node:fs'
import path from 'node:path'

import { cosmiconfig } from 'cosmiconfig'
import YAML from 'yaml'

import { merge } from './helpers.js'

/**
 * @typedef {import('cosmiconfig/dist/types').CosmiconfigResult} CosmiconfigResult
 */

/**
 * @typedef {object} TorrentCleanConfig
 * @property {string[]} [ignore] Globs to ignore files.
 * @property {boolean} [rememberLastTorrent] Save last specified torrent ID to config.
 * @property {string} [lastTorrent] Last specified torrent ID.
 */

/**
 * @typedef {object} LoadConfigResult
 * @property {TorrentCleanConfig} config Merged config.
 * @property {CosmiconfigResult} [searchFromCosmiconfigResult] `cosmiconfig`
 * search result inside `searchFrom`.
 */

/** @typedef {'json' | 'yaml'} FileType */

const MODULE_NAME = 'torrent-clean'

const COSMICONFIG_SEARCH_PLACES = [
  `.${MODULE_NAME}rc`,
  `.${MODULE_NAME}rc.json`,
  `.${MODULE_NAME}rc.yaml`,
  `.${MODULE_NAME}rc.yml`,
]
/** Default ignore patterns. */
const IGNORE_GLOBS = ['~uTorrentPartFile*', `.${MODULE_NAME}rc*`]

/**
 * Loads and merges configs starting from `searchFrom` directory.
 *
 * @param {string} searchFrom Config search start directory.
 * @param {TorrentCleanConfig} [customConfig] Config with highest priority.
 * @returns {Promise<LoadConfigResult>}
 */
export async function loadConfig(searchFrom, customConfig) {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: COSMICONFIG_SEARCH_PLACES,
  })

  /** @type {CosmiconfigResult} */
  let searchFromCosmiconfigResult

  /** @type {CosmiconfigResult[]} */
  const results = []
  /** @type {CosmiconfigResult} */
  let result = await explorer.search(searchFrom)

  // Remember `startFrom` search config result
  if (result && path.dirname(result.filepath) === searchFrom) {
    searchFromCosmiconfigResult = result
  }

  // Collect all configs up to root directory
  while (result) {
    results.push(result)

    const configDirectoryName = path.dirname(result.filepath)
    const parentDirectory = path.resolve(configDirectoryName, '..')

    // The root is reached
    if (parentDirectory === configDirectoryName) {
      break
    }

    result = await explorer.search(parentDirectory)
  }

  /** @type {TorrentCleanConfig} */
  const mergedConfig = [
    // The closer config to `searchFrom` directory is, the higher its priority
    ...results
      .filter(Boolean)
      // @ts-ignore `.filter(Boolean)` ensures none of `result` below is null
      .map((result) => result.config)
      .reverse(),
    customConfig,
  ]
    .filter(Boolean)
    .reduce((result, config) => merge(result, config), {})

  mergedConfig.ignore = mergedConfig.ignore
    ? [...IGNORE_GLOBS, ...mergedConfig.ignore]
    : IGNORE_GLOBS

  return {
    config: mergedConfig,
    ...(searchFromCosmiconfigResult && { searchFromCosmiconfigResult }),
  }
}

/**
 * Detects file type by file path.
 *
 * @param {string} filepath
 * @returns {FileType}
 */
function getFileType(filepath) {
  const extension = path.extname(filepath)

  if (extension === '.json') {
    return 'json'
  } else if (['.yaml', '.yml'].includes(extension)) {
    return 'yaml'
  } else {
    const content = fs.readFileSync(filepath).toString()

    try {
      JSON.parse(content)

      return 'json'
    } catch {
      return 'yaml'
    }
  }
}

/**
 * Saves config.
 *
 * @param {object} params
 * @param {TorrentCleanConfig} params.config
 * @param {string} params.saveDirectoryPath
 * @param {string} [params.existingConfigPath] Path to existing config file.
 */
export function saveConfig({ config, saveDirectoryPath, existingConfigPath }) {
  /** @type {FileType} */
  const fileType = existingConfigPath ? getFileType(existingConfigPath) : 'yaml'

  const fileContent =
    fileType === 'json'
      ? JSON.stringify(config, undefined, 2)
      : YAML.stringify(config)

  const filename =
    existingConfigPath || path.join(saveDirectoryPath, `.${MODULE_NAME}rc.yaml`)

  fs.writeFileSync(filename, fileContent)
}
