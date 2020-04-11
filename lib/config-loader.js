const path = require('path')
const { cosmiconfigSync } = require('cosmiconfig')
const moduleName = require('../package.json').name

/**
 * @typedef {import('cosmiconfig/dist/types').CosmiconfigResult} CosmiconfigResult
 */

/**
 * @typedef {object} TorrentCleanConfig
 * @property {string[]} [ignore] Globs to ignore files
 * @property {boolean} [dryRun] Postpone deleting files until confirm function
 * is called
 */

/** Default ignore patterns */
const IGNORE_GLOBS = ['~uTorrentPartFile*', `.${moduleName}rc*`]

/**
 * Loads and merges configs starting from `searchFrom` directory
 *
 * @param {string} searchFrom
 * @param {TorrentCleanConfig} [customConfig] Config with highest priority
 * @returns {TorrentCleanConfig}
 */
exports.loadConfig = function loadConfig(searchFrom, customConfig) {
  const explorer = cosmiconfigSync(moduleName, {
    searchPlaces: [
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
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
 * Checks if array consists on unique elements
 *
 * @param {*} value
 * @param {number} index `value` index in `array`
 * @param {Array<*>} array
 * @returns {boolean}
 */
function isUnique(value, index, array) {
  return array.indexOf(value) === index
}
