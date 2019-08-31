#!/usr/bin/env node

const os = require('os')
const path = require('path')
const recursive = require('recursive-readdir')
const { Confirm, MultiSelect } = require('enquirer')
const chalk = require('chalk')

const logColor = require('./log-color')
const parseTorrent = require('./parse-torrent')
const deleteFilesAndEmptyFolders = require('./delete-files')

const IGNORE_GLOBS = ['~uTorrentPartFile*']

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

console.log(logColor.info('Parsing torrent file...'))
Promise.all([parseTorrent(torrentId), recursive(directoryPath, IGNORE_GLOBS)])
  .then(async ([parseResult, dirFiles]) => {
    if (!parseResult) {
      return
    }

    const { name, files } = parseResult

    console.log(`Parsed ${chalk.bold(name)}.`, os.EOL)

    const rootDir = `${name}${path.sep}`
    // Get absolute paths of torrent files
    const torrentFiles = files.map(file =>
      path.join(directoryPath, file.replace(rootDir, ''))
    )

    // Get absolute paths of files not included in the torrent
    const extraFiles = dirFiles.reduce((result, filename) => {
      if (torrentFiles.indexOf(filename) === -1) {
        result.push(filename)
      }

      return result
    }, [])

    if (extraFiles.length) {
      console.log(`Found ${chalk.bold(extraFiles.length)} extra file(s).`)

      const dirRoot = `${directoryPath}${path.sep}`

      const filesChoices = extraFiles.map(filename => ({
        name: filename.replace(dirRoot, ''),
        value: filename
      }))

      const filesToDeleteMultiSelect = new MultiSelect({
        name: 'selectFilesToDelete',
        message: `Select file(s) to delete (Use 'Space')`,
        choices: filesChoices,
        initial() {
          // TODO: Remove after https://github.com/enquirer/enquirer/issues/201 is fixed
          this.options.initial = filesChoices
          return filesChoices
        },
        // TODO: Just why? https://github.com/enquirer/enquirer/issues/121
        result(names) {
          // Get values from names
          return names.map(name => this.find(name).value)
        }
      })

      const filesToDelete = await filesToDeleteMultiSelect.run()

      if (filesToDelete.length === 0) {
        return
      }

      const deleteConfirm = new Confirm({
        name: 'delete',
        message: 'Delete extra files?',
        initial: true
      })

      const deleteFilesAnswer = await deleteConfirm.run()

      if (deleteFilesAnswer) {
        console.log()
        console.log(logColor.info('Deleting extra files...'))

        await deleteFilesAndEmptyFolders(filesToDelete, directoryPath)

        console.log('Files deleted.')
      }
    } else {
      console.log('No extra files found!')
    }
  })
  .catch(error => {
    console.log(logColor.error('Error ocurred'), error)
  })
