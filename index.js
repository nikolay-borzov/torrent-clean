#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const util = require('util')
const recursive = require('recursive-readdir')
const unlink = util.promisify(fs.unlink)
const deleteEmpty = require('delete-empty')
const { Confirm } = require('enquirer')
const chalk = require('chalk')
const WebTorrent = require('webtorrent')
const memoryChunkStore = require('memory-chunk-store')

const infoLog = chalk.green
const errorLog = chalk.bgRed
const fileLog = chalk.grey

const IGNORE_GLOBS = ['~uTorrentPartFile*']
const FILES_LIST_LIMIT = 20

async function getTorrentMetadata(torrentId) {
  return new Promise(resolve => {
    parseTorrent(torrentId, resolve)
  }).catch(error => {
    console.log(errorLog('Unable to parse torrent file'), error)
  })
}

function parseTorrent(torrentId, onDone) {
  const client = new WebTorrent()

  // Use memory-chunk-store to avoid creating directories inside tmp/webtorrent(https://github.com/webtorrent/webtorrent/issues/1562)
  const torrent = client.add(torrentId, {
    store: memoryChunkStore
  })

  torrent.on('metadata', function() {
    onDone({
      name: torrent.name,
      files: torrent.files.map(file => file.path)
    })

    client.destroy()
  })
}

async function deleteFiles(filenames) {
  try {
    const deletePromises = filenames.map(filename => unlink(filename))
    await Promise.all(deletePromises)
  } catch (error) {
    console.log(errorLog('Cannot delete files'), error)
  }
}

async function deleteEmptyFolders(dirPath) {
  try {
    await deleteEmpty(dirPath)
  } catch (error) {
    console.log(errorLog('Cannot delete empty directories'), error)
  }
}

function outputFilenames(filenames, verbose) {
  if (verbose) {
    filenames.forEach(filename => console.log(fileLog(filename)))
  } else {
    const limit = Math.min(FILES_LIST_LIMIT, filenames.length)

    for (let i = 0; i < limit; i++) {
      console.log(fileLog(filenames[i]))
    }

    if (limit < filenames.length) {
      console.log(fileLog(`...and ${filenames.length - limit} more`))
    }
  }

  console.log()
}

const argv = require('minimist')(process.argv.slice(2), {
  alias: { torrent: ['t'], dir: ['d'] },
  boolean: ['verbose'],
  default: { dir: process.cwd(), verbose: false }
})

console.log(infoLog.bold('dir:'.padEnd(10)), argv.dir)
console.log(infoLog.bold('torrent:'.padEnd(10)), argv.torrent, os.EOL)

if (!argv.torrent) {
  console.log(errorLog(`${chalk.bold('torrent')} argument is required`))
  return
}

const torrentId = argv.torrent
const directoryPath = path.resolve(argv.dir)
const verbose = argv.verbose

console.log(infoLog('Parsing torrent file...'))
Promise.all([
  getTorrentMetadata(torrentId),
  recursive(directoryPath, IGNORE_GLOBS)
]).then(async ([parseResult, dirFiles]) => {
  if (!parseResult) {
    return
  }

  const { name, files } = parseResult

  console.log(`Parsed ${chalk.bold(name)}.`, os.EOL)

  const rootDir = `${name}${path.sep}`
  const torrentFiles = files.map(file =>
    path.join(directoryPath, file.replace(rootDir, ''))
  )

  const outdated = dirFiles.reduce((result, filename) => {
    if (torrentFiles.indexOf(filename) === -1) {
      result.push(filename)
    }

    return result
  }, [])

  if (outdated.length) {
    console.log(`Found ${chalk.bold(outdated.length)} outdated file(s).`)

    const dirRoot = `${directoryPath}${path.sep}`
    const filenames = outdated.map(filename => filename.replace(dirRoot, ''))
    outputFilenames(filenames, verbose)

    const deleteConfirm = new Confirm({
      name: 'delete',
      message: 'Delete outdated files?',
      initial: true
    })

    const deleteFilesAnswer = await deleteConfirm.run()

    if (deleteFilesAnswer) {
      console.log()
      console.log(infoLog('Deleting outdated files...'))

      await deleteFiles(outdated)
      await deleteEmptyFolders(directoryPath)

      console.log('Files deleted.')
    }
  } else {
    console.log('No outdated files found!')
  }
})
