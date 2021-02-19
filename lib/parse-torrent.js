import WebTorrent from 'webtorrent'
import memoryChunkStore from 'memory-chunk-store'
import path from 'path'

/**
 * @typedef {import('parse-torrent').Instance} ParseTorrent
 */

/**
 * Magnet URI, .torrent file, info hash.
 *
 * @typedef {string | Buffer | File | ParseTorrent} TorrentId
 */

/**
 * @typedef {object} TorrentParseResult
 * @property {string} name Torrent name.
 * @property {string[]} files Torrent relative filenames.
 */

/**
 * @param {TorrentId} torrentId
 * @returns {Promise<TorrentParseResult>}
 */
export async function getTorrentMetadata(torrentId) {
  return new Promise((resolve, reject) => {
    parseTorrent(torrentId, resolve, reject)
  })
}

/**
 * @param {TorrentId} torrentId
 * @param {(result: TorrentParseResult) => void} onDone
 * @param {(error: string | Error) => void} onError
 */
function parseTorrent(torrentId, onDone, onError) {
  const client = new WebTorrent()

  // Use `memory-chunk-store` to avoid creating directories inside tmp/webtorrent (https://github.com/webtorrent/webtorrent/issues/1562)
  const torrent = client.add(torrentId, {
    store: memoryChunkStore,
  })

  torrent.on('error', (error) => {
    onError(error)

    client.destroy()
  })

  torrent.on('metadata', () => {
    const rootDirectory = `${torrent.name}${path.sep}`

    onDone({
      name: torrent.name,
      files: torrent.files.map((file) => file.path.replace(rootDirectory, '')),
    })

    client.destroy()
  })
}
