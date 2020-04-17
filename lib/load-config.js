const path = require('path')
const { cosmiconfigSync } = require('cosmiconfig')

/**
 * @typedef {import('cosmiconfig/dist/types').CosmiconfigResult} CosmiconfigResult
 */

/**
 * @typedef {object} TorrentCleanConfig
 * @property {string[]} [ignore] Globs to ignore files
 * @property {boolean} [rememberLastTorrent] Save last specified torrent ID to config
 */

const MODULE_NAME = 'torrent-clean'
/** Default ignore patterns */
const IGNORE_GLOBS = ['~uTorrentPartFile*', `.${MODULE_NAME}rc*`]

/**
 * Merges two objects recursively
 *
 * @param {object} a
 * @param {object} b
 * @returns {object} Merged object
 */
function merge(a, b) {
  return Object.keys(b).reduce((target, prop) => {
    const srcValue = b[prop]
    const targetValue = target[prop]
    let value

    if (targetValue === undefined) {
      value = srcValue
    } else if (isObject(targetValue)) {
      value = merge(targetValue, srcValue)
    } else if (Array.isArray(targetValue)) {
      value = [...srcValue, ...targetValue].filter(isUnique)
    } else {
      value = srcValue
    }

    target[prop] = value

    return target
  }, a)
}

/**
 * Naive check for Object
 *
 * @param {object} value
 * @returns {boolean}
 */
function isObject(value) {
  return typeof value === 'object' && !Array.isArray(value)
}

/**
 * Checks if array consists of unique elements
 *
 * @param {*} value
 * @param {number} index `value` index in `array`
 * @param {Array<*>} array
 * @returns {boolean}
 */
function isUnique(value, index, array) {
  return array.indexOf(value) === index
}

/**
 * Loads and merges configs starting from `searchFrom` directory
 *
 * @param {string} searchFrom
 * @param {TorrentCleanConfig} [customConfig] Config with highest priority
 * @returns {TorrentCleanConfig}
 */
exports.loadConfig = function loadConfig(searchFrom, customConfig) {
  const explorer = cosmiconfigSync(MODULE_NAME, {
    searchPlaces: [
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.yaml`,
      `.${MODULE_NAME}rc.yml`,
      `.${MODULE_NAME}rc.js`,
    ],
  })

  /** @type {CosmiconfigResult[]} */
  const results = []
  /** @type {CosmiconfigResult} */
  let result = explorer.search(searchFrom)

  // Collect all configs up to root directory
  while (result) {
    results.push(result)

    const configDirName = path.dirname(result.filepath)
    const parentDir = path.resolve(configDirName, '..')

    result = explorer.search(parentDir)
  }

  /** @type {TorrentCleanConfig} */
  const mergedConfig = [
    // The closer config to `searchFrom` directory is, the higher its priority
    ...results.map((result) => result.config).reverse(),
    customConfig,
  ]
    .filter(Boolean)
    .reduce(merge, {})

  if (mergedConfig.ignore) {
    mergedConfig.ignore = [...IGNORE_GLOBS, ...mergedConfig.ignore]
  } else {
    mergedConfig.ignore = IGNORE_GLOBS
  }

  return mergedConfig
}
