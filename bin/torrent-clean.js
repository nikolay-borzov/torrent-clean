#!/usr/bin/env node --no-warnings

import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import chalk from 'chalk'
import enquirer from 'enquirer'
import minimist from 'minimist'

import { cleanTorrentDirectory } from '../lib/api.js'
import { FilesSelect } from '../lib/file-select-prompt.js'
import * as logColor from '../lib/log-color.js'

const { Confirm } = enquirer

const FILES_ON_SCREEN_LIMIT = 20

const argv = minimist(process.argv.slice(2), {
  alias: { torrent: ['t'], dir: ['d'], version: ['v'] },
  default: { dir: process.cwd() },
})

if (argv.version) {
  const packageJsonPath = new URL('../package.json', import.meta.url)
  const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())

  console.log(packageJson.version)
} else {
  try {
    await run(argv)
  } catch (error) {
    console.log(logColor.error(error.stack))

    process.exitCode = 1
  }
}

/**
 * Runs CLI logic.
 *
 * @param {minimist.ParsedArgs} argv
 */
async function run(argv) {
  const torrentId = argv.torrent
  const directoryPath = path.resolve(argv.dir)

  const { torrentName, extraFiles, deleteFiles } = await cleanTorrentDirectory({
    torrentId,
    directoryPath,
    dryRun: true,
    onConfigLoaded(torrentId) {
      console.log(logColor.info.bold('directory:'.padEnd(10)), argv.dir)
      console.log(logColor.info.bold('torrent:'.padEnd(10)), torrentId, os.EOL)

      console.log(logColor.info('Parsing torrent file...'), os.EOL)
    },
  })

  console.log(`Parsed ${chalk.bold(torrentName)}`)

  if (extraFiles.length === 0) {
    console.log('No extra files found!')

    return
  }

  console.log(`Found ${chalk.bold(extraFiles.length)} extra file(s).`, os.EOL)

  const directoryRoot = `${directoryPath}${path.sep}`

  const filesChoices = extraFiles.map((filename) => ({
    name: filename.replace(directoryRoot, ''),
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
    /** @param {string[]} names */
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
}
