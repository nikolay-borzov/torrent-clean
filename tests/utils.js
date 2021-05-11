import fs from 'node:fs'
import path from 'node:path'

/**
 * @param {object} filesTree
 * @param {string} atPath
 */
export function createFiles(filesTree, atPath) {
  fs.mkdirSync(atPath, { recursive: true })

  for (const [filename, value] of Object.entries(filesTree)) {
    if (typeof value === 'string') {
      fs.writeFileSync(path.join(atPath, filename), value)
    } else {
      createFiles(value, path.join(atPath, filename))
    }
  }
}
