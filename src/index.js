#!/usr/bin/env node

const os = require('os')
const path = require('path')
const recursive = require('recursive-readdir')
const { Confirm } = require('enquirer')
const chalk = require('chalk')

const logColor = require('./log-color')
const parseTorrent = require('./parse-torrent')
const deleteFilesAndEmptyFolders = require('./delete-files')

const IGNORE_GLOBS = ['~uTorrentPartFile*']
const FILES_LIST_LIMIT = 20

function outputFilenames(filenames, verbose) {
  if (verbose) {
    filenames.forEach(filename => console.log(logColor.fileName(filename)))
  } else {
    const limit = Math.min(FILES_LIST_LIMIT, filenames.length)

    for (let i = 0; i < limit; i++) {
      console.log(logColor.fileName(filenames[i]))
    }

    if (limit < filenames.length) {
      console.log(logColor.fileName(`...and ${filenames.length - limit} more`))
    }
  }

  console.log()
}

const argv = require('minimist')(process.argv.slice(2), {
  alias: { torrent: ['t'], dir: ['d'] },
  boolean: ['verbose'],
  default: { dir: process.cwd(), verbose: false }
})

console.log(logColor.info.bold('dir:'.padEnd(10)), argv.dir)
console.log(logColor.info.bold('torrent:'.padEnd(10)), argv.torrent, os.EOL)

if (!argv.torrent) {
  console.log(logColor.error(`${chalk.bold('torrent')} argument is required`))
  return
}

const torrentId = argv.torrent
const directoryPath = path.resolve(argv.dir)
const verbose = argv.verbose

console.log(logColor.info('Parsing torrent file...'))
Promise.all([
  parseTorrent(torrentId),
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
    console.log(`Found ${chalk.bold(outdated.length)} extra file(s).`)

    const dirRoot = `${directoryPath}${path.sep}`
    const filenames = outdated.map(filename => filename.replace(dirRoot, ''))
    outputFilenames(filenames, verbose)

    const deleteConfirm = new Confirm({
      name: 'delete',
      message: 'Delete extra files?',
      initial: true
    })

    const deleteFilesAnswer = await deleteConfirm.run()

    if (deleteFilesAnswer) {
      console.log()
      console.log(logColor.info('Deleting extra files...'))

      await deleteFilesAndEmptyFolders(outdated, directoryPath)

      console.log('Files deleted.')
    }
  } else {
    console.log('No extra files found!')
  }
})
