#!/usr/bin/env node

const os = require('os')
const path = require('path')
const { Confirm } = require('enquirer')
const chalk = require('chalk')

const cleanTorrentDir = require('../lib/api')
const packageJson = require('../package.json')
const logColor = require('../lib/log-color')
const FilesSelect = require('../lib/file-select-prompt')
const minimist = require('minimist')

const FILES_ON_SCREEN_LIMIT = 20

const argv = minimist(process.argv.slice(2), {
  alias: { torrent: ['t'], dir: ['d'], version: ['v'] },
  default: { dir: process.cwd() },
})

if (argv.version) {
  console.log(packageJson.version)
} else {
  const torrentId = argv.torrent
  const dirPath = path.resolve(argv.dir)

  cleanTorrentDir({
    torrentId,
    dirPath,
    dryRun: true,
    onConfigLoaded(torrentId) {
      console.log(logColor.info.bold('directory:'.padEnd(10)), argv.dir)
      console.log(logColor.info.bold('torrent:'.padEnd(10)), torrentId, os.EOL)

      console.log(logColor.info('Parsing torrent file...'), os.EOL)
    },
  })
    .then(async ({ torrentName, extraFiles, deleteFiles }) => {
      console.log(`Parsed ${chalk.bold(torrentName)}`)

      if (extraFiles.length === 0) {
        console.log('No extra files found!')
        return
      }

      console.log(
        `Found ${chalk.bold(extraFiles.length)} extra file(s).`,
        os.EOL
      )

      const dirRoot = `${dirPath}${path.sep}`

      const filesChoices = extraFiles.map((filename) => ({
        name: filename.replace(dirRoot, ''),
        value: filename,
      }))

      const filesToDeleteMultiSelect = new FilesSelect({
        name: 'selectFilesToDelete',
        message: `Select file(s) to delete ('space' - toggle item selection, 'i' - invert selection)`,
        choices: filesChoices,
        limit: FILES_ON_SCREEN_LIMIT,
        indicator: '■',
        initial() {
          // TODO: Remove after https://github.com/enquirer/enquirer/issues/201 is fixed
          this.options.initial = filesChoices
          return filesChoices
        },
        // Get values from selected names https://github.com/enquirer/enquirer/issues/121
        result(names) {
          return names.map((name) => this.find(name).value)
        },
      })

      const filesToDelete = await filesToDeleteMultiSelect.run()

      if (filesToDelete.length === 0) {
        return
      }

      const deleteConfirm = new Confirm({
        name: 'delete',
        message: 'Delete extra files?',
        initial: true,
      })

      const deleteFilesAnswer = await deleteConfirm.run()

      if (deleteFilesAnswer) {
        console.log()
        console.log(logColor.info('Deleting extra files...'))

        await deleteFiles(filesToDelete)

        console.log('Files deleted.')
      }
    })
    .catch((error) => {
      console.log(logColor.error(error.stack))

      process.exitCode = 1
    })
}
