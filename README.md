# torrent-clean [![npm][npm-image]][npm-url] [![JavaScript Style Guide][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/torrent-clean.svg
[npm-url]: https://npmjs.org/package/torrent-clean
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

CLI utility deletes files not listed in selected torrent. Useful when torrent is updated and some files have been removed.

## Install

```
npm i -g torrent-clean
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
 - `ignore` - an array of globs or filenames that will be excluded from the list of extra files.

## Known issues

- Torrent files with names containing unicode characters (e.g. 𝗚𝗪𝗔 1.txt) cannot be parsed correctly.
- Parsing torrent by hash can sometimes hang. It's better to pass path to torrent file.

### Built with

- [webtorrent](https://github.com/webtorrent/webtorrent)
- [minimist](https://github.com/substack/minimist)
- [cosmiconfig](https://github.com/davidtheclark/cosmiconfig)
- [enquirer](https://github.com/enquirer/enquirer)
- [recursive-readdir](https://github.com/jergason/recursive-readdir)
- [delete-empty](https://github.com/jonschlinkert/delete-empty)
- [chalk](https://github.com/chalk/chalk)
