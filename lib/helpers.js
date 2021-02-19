/**
 * Naive check for Object.
 *
 * @param {object} value
 * @returns {boolean}
 */
function isObject(value) {
  return typeof value === 'object' && !Array.isArray(value)
}

/**
 * Checks if array consists of unique elements.
 *
 * @param {*} value
 * @param {number} index `value` index in `array`.
 * @param {Array<*>} array
 * @returns {boolean}
 */
function isUnique(value, index, array) {
  return array.indexOf(value) === index
}

/**
 * Merges two objects recursively.
 *
 * @param {object} a
 * @param {object} b
 * @returns {object} Merged object.
 */
export function merge(a, b) {
  return Object.keys(b).reduce((target, property) => {
    const sourceValue = b[property]
    const targetValue = target[property]
    let value

    if (targetValue === undefined) {
      value = sourceValue
    } else if (isObject(targetValue)) {
      value = merge(targetValue, sourceValue)
    } else if (Array.isArray(targetValue)) {
      value = [...sourceValue, ...targetValue].filter((value, index, array) =>
        isUnique(value, index, array)
      )
    } else {
      value = sourceValue
    }

    target[property] = value

    return target
  }, a)
}
