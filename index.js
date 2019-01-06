#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const util = require('util')
const recursive = require('recursive-readdir')
const parseTorrent = util.promisify(require('parse-torrent').remote)
const unlink = util.promisify(fs.unlink)
const { Confirm } = require('enquirer')

const argv = require('minimist')(process.argv.slice(2), {
  alias: { torrent: ['t'], dir: ['d'] },
  default: { dir: process.cwd() }
})

const IGNORE_GLOBS = ['~uTorrentPartFile*']

console.info('dir:'.padEnd(10), argv.dir)
console.info('torrent:'.padEnd(10), argv.torrent)

if (!argv.torrent) {
  console.error(`'torrent' argument is required`)
  return
}

const torrentPath = argv.torrent
const directoryPath = argv.dir

async function processResults([{ name, files }, dirFiles]) {
  console.info(`Parsed ${name}.`)
  const rootDir = `${name}${path.sep}`

  const torrentFiles = files.map(file =>
    path.join(directoryPath, file.path.replace(rootDir, ''))
  )

  const outdated = dirFiles.reduce((result, filename) => {
    if (torrentFiles.indexOf(filename) === -1) {
      result.push(filename)
    }

    return result
  }, [])

  if (outdated.length) {
    console.info(`Found ${outdated.length} outdated files.`)

    const dirRoot = `${directoryPath}${path.sep}`
    console.log(outdated.map(filename => filename.replace(dirRoot, '')))

    const deleteConfirm = new Confirm({
      name: 'delete',
      message: 'Delete outdated files?',
      initial: true
    })

    const deleteFiles = await deleteConfirm.run()

    if (deleteFiles) {
      console.info('Deleting outdated files...')

      const deletePromises = outdated.map(filename => unlink(filename))
      await Promise.all(deletePromises)

      console.info('Files deleted.')
    }
  } else {
    console.info('No outdated files found!')
  }
}

console.info('Parsing torrent file...')
Promise.all([
  parseTorrent(torrentPath),
  recursive(directoryPath, IGNORE_GLOBS)
]).then(processResults)
