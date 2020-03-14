const path = require('path')
const { cosmiconfigSync } = require('cosmiconfig')
const moduleName = require('../package.json').name

/**
 * @typedef {Object} Config
 * @property {string[]} ignore Globs to ignore files
 */

const IGNORE_GLOBS = ['~uTorrentPartFile*', `.${moduleName}rc*`]

/**
 * @param {string} searchFrom
 * @returns {Config}
 */
function loadConfig(searchFrom) {
  const explorer = cosmiconfigSync(moduleName, {
    searchPlaces: [
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`
    ]
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

  const mergedConfig = results
    .map(result => result.config)
    .reverse()
    .reduce(merge, {})

  if (mergedConfig.ignore) {
    mergedConfig.ignore = [...IGNORE_GLOBS, ...mergedConfig.ignore]
  } else {
    mergedConfig.ignore = IGNORE_GLOBS
  }

  return mergedConfig
}

/**
 * Merge two objects recursively
 * @param {Object} a
 * @param {Object} b
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
      value = [...targetValue, ...srcValue].filter(unique)
    } else {
      value = srcValue
    }

    target[prop] = value

    return target
  }, a)
}

/**
 * Naive check for Object
 * @param {Object} value
 */
function isObject(value) {
  return typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {*} value
 * @param {number} index
 * @param {Array} array
 */
function unique(value, index, array) {
  return array.indexOf(value) === index
}

module.exports = loadConfig
