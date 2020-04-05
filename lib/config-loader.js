const path = require('path')
const { cosmiconfigSync } = require('cosmiconfig')
const moduleName = require('../package.json').name

/**
 * @typedef {object} TorrentCleanConfig
 * @property {string[]} ignore Globs to ignore files
 */

const IGNORE_GLOBS = ['~uTorrentPartFile*', `.${moduleName}rc*`]

/**
 * Loads and merges configs starting from `searchFrom`
 *
 * @param {string} searchFrom
 * @param {TorrentCleanConfig} [customConfig] Config with highest priority
 * @returns {TorrentCleanConfig}
 */
function loadConfig(searchFrom, customConfig) {
  const explorer = cosmiconfigSync(moduleName, {
    searchPlaces: [
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
    ],
  })

  const results = []
  let result = explorer.search(searchFrom)

  // Collect all configs up to root directory
  while (result) {
    results.push(result)
    const configDirName = path.dirname(result.filepath)
    const parentDir = path.resolve(configDirName, '..')

    result = explorer.search(parentDir)
  }

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

    if (typeof targetValue === 'undefined') {
      value = srcValue
    } else if (isObject(targetValue)) {
      value = merge(targetValue, srcValue)
    } else if (Array.isArray(targetValue)) {
      value = [...targetValue, ...srcValue].filter(isUnique)
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
 * Checks if `value` presented only once in `array`
 *
 * @param {*} value
 * @param {number} index `value` index in `array`
 * @param {Array} array
 * @returns {boolean}
 */
function isUnique(value, index, array) {
  return array.indexOf(value) === index
}

module.exports = loadConfig
