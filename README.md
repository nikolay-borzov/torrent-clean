# torrent-clean
[![NPM version][npm-image]][npm-url]
![][CI-image]
[![Inline docs][docs-image]][docs-url]
[![Known Vulnerabilities][vulnerabilities-image]][vulnerabilities-url]
[![Maintainability][maintability-image]][maintability-url]
[![Style Guide][style-guide-image]][style-guide-url]
[![Dependencies Status][dependencies-image]][dependencies-url]

[npm-image]: https://img.shields.io/npm/v/torrent-clean.svg
[npm-url]: https://npmjs.org/package/torrent-clean
[CI-image]: https://github.com/nikolay-borzov/torrent-clean/workflows/CI/badge.svg
[docs-image]: https://inch-ci.org/github/nikolay-borzov/torrent-clean.svg?branch=master
[docs-url]: https://inch-ci.org/github/nikolay-borzov/torrent-clean
[vulnerabilities-image]: https://snyk.io/test/github/nikolay-borzov/torrent-clean/badge.svg?targetFile=package.json
[vulnerabilities-url]: https://snyk.io/test/github/nikolay-borzov/torrent-clean?targetFile=package.json
[maintability-image]: https://api.codeclimate.com/v1/badges/093465c943260646aa40/maintainability
[maintability-url]: https://codeclimate.com/github/nikolay-borzov/torrent-clean/maintainability
[style-guide-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[style-guide-url]: https://standardjs.com
[dependencies-image]: https://david-dm.org/nikolay-borzov/torrent-clean/status.svg
[dependencies-url]: https://david-dm.org/nikolay-borzov/torrent-clean

CLI utility deletes files not listed in selected torrent. Useful when torrent is updated and some files have been removed.

## Install

```
npm i -g @nikolay-borzov\torrent-clean
```

## Usage

```
C:\Downloads\NaturePack\torrent-clean -t C:\torrents\nature-pack.torrent
```
gets files' paths from `nature-pack.torrent` and compares them with files from `C:\Downloads\NaturePack\`. Then files not presented in `nature-pack.torrent` can be deleted.

`torrent-clean` has `tc` alias.

## Arguments

`--torrent` (or `-t`) - Torrent id (as described in [webtorrent api](https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-))
- Magnet URI (e.g. `magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36`)
- Info Hash (e.g. `d2474e86c95b19b8bcfdb92bc12c9d44667cfa36`)
- http/https URL to a torrent file
- Filesystem path to a torrent file

`--dir` (or `-d`) - Path to directory with downloaded files

`--version` - Outputs the app version

## Config files

`torrent-clean` allows specifying some parameters via config file (`.torrent-cleanrc`, `.torrent-cleanrc.json`, `.torrent-cleanrc.yaml`, `.torrent-cleanrc.yml` or `.torrent-cleanrc.js`). There are might be many files - `torrent-clean` will collect and merge all files up to root directory. The closer config to the directory is, the higher its priority

Parameter are:
 - `ignore` - an array of globs (picomatch) or filenames that will be excluded from the list of extra files.

## API
`cleanTorrentDir` accepts options object:
```javascript
{
  torrentId: '6a9759bffd5c0af65319979fb7832189f4f3c35d',
  // Directory to clean
  directoryPath: 'C:/Downloads/wallpapers/nature',
  // Do not delete files immediately. Instead return `deleteFiles` function
  dryRun: true,
  // Config with highest priority
  customConfig: { ignore: ['**/*\(edited\)*'] }
}
```


```javascript
const cleanTorrentDir = require('torrent-clean')

const { extraFiles } = await cleanTorrentDir({
  torrentId: 'C:/Downloads/torrents/nature wallpapers.torrent',
  directoryPath: 'C:/Downloads/wallpapers/nature'
})

console.log('Removed', extraFiles)
```

```javascript
const cleanTorrentDir = require('torrent-clean')

const { extraFiles, deleteFiles } = await cleanTorrentDir({
  torrentId: '6a9759bffd5c0af65319979fb7832189f4f3c35d',
  directoryPath: 'C:/Downloads/wallpapers/nature',
  dryRun: true,
  customConfig: { ignore: ['**/*\(edited\)*'] }
})

console.log('Removing', extraFiles)

await deleteFiles(extraFiles)
```

## Known issues

- Torrent files with names containing unicode characters (e.g. 𝗚𝗪𝗔 1.txt) cannot be parsed correctly.
- Parsing torrent by hash can sometimes hang. It's better to pass path to torrent file.

### Built with

- [webtorrent](https://github.com/webtorrent/webtorrent)
- [minimist](https://github.com/substack/minimist)
- [cosmiconfig](https://github.com/davidtheclark/cosmiconfig)
- [enquirer](https://github.com/enquirer/enquirer)
- [readdirp](https://github.com/paulmillr/readdirp)
- [picomatch](https://github.com/micromatch/picomatch)
- [delete-empty](https://github.com/jonschlinkert/delete-empty)
- [chalk](https://github.com/chalk/chalk)
