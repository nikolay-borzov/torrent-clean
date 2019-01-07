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

`--torrent` (or `-t`) - Path to torrent file

`--dir` (or `-d`) - Path to directory with downloaded files

`--verbose` - Output all outdated filenames. By default only first 20 filenames are displayed

### Build with

- [parse-torrent](https://github.com/webtorrent/parse-torrent)
- [minimist](https://github.com/substack/minimist)
- [enquirer](https://github.com/enquirer/enquirer)
- [recursive-readdir](https://github.com/jergason/recursive-readdir)
- [delete-empty](https://github.com/jonschlinkert/delete-empty)
- [chalk](https://github.com/chalk/chalk)