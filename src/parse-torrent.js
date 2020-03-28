const WebTorrent = require('webtorrent')
const memoryChunkStore = require('memory-chunk-store')

async function getTorrentMetadata(torrentId) {
  return new Promise((resolve, reject) => {
    parseTorrent(torrentId, resolve, reject)
  })
}

function parseTorrent(torrentId, onDone, onError) {
  const client = new WebTorrent()

  // Use memory-chunk-store to avoid creating directories inside tmp/webtorrent (https://github.com/webtorrent/webtorrent/issues/1562)
  const torrent = client.add(torrentId, {
    store: memoryChunkStore,
  })

  torrent.on('error', (error) => {
    onError(error)

    client.destroy()
  })

  torrent.on('metadata', () => {
    onDone({
      name: torrent.name,
      files: torrent.files.map((file) => file.path),
    })

    client.destroy()
  })
}

module.exports = getTorrentMetadata
