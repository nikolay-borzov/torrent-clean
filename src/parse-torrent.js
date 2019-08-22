const WebTorrent = require('webtorrent')
const memoryChunkStore = require('memory-chunk-store')

const logColor = require('./log-color')

async function getTorrentMetadata(torrentId) {
  return new Promise(resolve => {
    parseTorrent(torrentId, resolve)
  }).catch(error => {
    console.log(logColor.error('Unable to parse torrent'), error)
  })
}

function parseTorrent(torrentId, onDone) {
  const client = new WebTorrent()

  // Use memory-chunk-store to avoid creating directories inside tmp/webtorrent(https://github.com/webtorrent/webtorrent/issues/1562)
  const torrent = client.add(torrentId, {
    store: memoryChunkStore
  })

  torrent.on('metadata', () => {
    onDone({
      name: torrent.name,
      files: torrent.files.map(file => file.path)
    })

    client.destroy()
  })
}

module.exports = getTorrentMetadata
