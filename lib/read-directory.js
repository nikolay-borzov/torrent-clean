import picomatch from 'picomatch'
import readdirp from 'readdirp'

/**
 * Reads directory recursively returning file' paths.
 *
 * @param {string} path
 * @param {string[]} [ignoreGlobs]
 * @returns {Promise<string[]>} Directory files' absolute paths.
 */
export async function readDirectory(path, ignoreGlobs = []) {
  const ignoreMatch = picomatch(ignoreGlobs)

  const entryInfos = await readdirp.promise(path, {
    ...(ignoreMatch && {
      fileFilter(entry) {
        return !ignoreMatch(entry.path)
      },
    }),
  })

  return entryInfos.map((entryInfo) => entryInfo.fullPath)
}
