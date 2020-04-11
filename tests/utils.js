const fs = require('fs')
const path = require('path')

/**
 * @param {object} filesTree
 * @param {string} atPath
 */
exports.createFiles = function createFiles(filesTree, atPath) {
  fs.mkdirSync(atPath, { recursive: true })

  Object.entries(filesTree).forEach(([filename, value]) => {
    if (typeof value === 'string') {
      fs.writeFileSync(path.join(atPath, filename), value)
    } else {
      createFiles(value, path.join(atPath, filename))
    }
  })
}
