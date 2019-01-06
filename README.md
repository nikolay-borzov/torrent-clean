# torrent-clean

CLI utility that parses specified torrent file and removes files that are missed in torrent file. Useful when torrent is updated and some files have been removed.

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

`--torrent` (or `-t`) - path to torrent file

`--dir` (or `-d`) - path to directory with downloaded files

### Build with

- [parse-torrent](https://github.com/webtorrent/parse-torrent)
- [minimist](https://github.com/substack/minimist)
- [enquirer](https://github.com/enquirer/enquirer)
- [recursive-readdir](https://github.com/jergason/recursive-readdir)