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
 * Merges two objects recursively
 *
 * @param {object} a
 * @param {object} b
 * @returns {object} Merged object
 */
exports.merge = function merge(a, b) {
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
