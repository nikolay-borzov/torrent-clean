# torrent-clean

CLI utility that parses specified torrent file and removes files that are not specified in torrent file. Useful when torrent is updated and some files have been removed. Also, it deletes empty directories.

## Install

```
npm i -g torrent-clean
```

## Usage

```
C:\Downloads\NaturePack\torrent-clean -t C:\torrents\nature-pack.torrent
```
gets files' paths from `nature-pack.torrent` and compares them with files from `C:\Downloads\NaturePack\`. Then files not presented in `nature-pack.torrent` can be deleted.

## Arguments

`--torrent` (or `-t`) - Torrent id (as described in [webtorrent api](https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-))
- Magnet URI (e.g. `magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36`)
- Info Hash (e.g. `d2474e86c95b19b8bcfdb92bc12c9d44667cfa36`)
- http/https URL to a torrent file
- Filesystem path to a torrent file

`--dir` (or `-d`) - Path to directory with downloaded files

`--verbose` - Output all outdated filenames. By default only first 20 filenames are displayed

## Known bugs

- Torrent files with names containing unicode characters (e.g. 𝗚𝗪𝗔 1.txt) cannot be parsed correctly.

### Build with

- [webtorrent](https://github.com/webtorrent/webtorrent)
- [minimist](https://github.com/substack/minimist)
- [enquirer](https://github.com/enquirer/enquirer)
- [recursive-readdir](https://github.com/jergason/recursive-readdir)
- [delete-empty](https://github.com/jonschlinkert/delete-empty)
- [chalk](https://github.com/chalk/chalk)