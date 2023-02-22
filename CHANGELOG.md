# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!--
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
### BREAKING CHANGES
-->

## [v3.0.0](https://github.com/nikolay-borzov/torrent-clean/compare/v2.0.0...v3.0.0) - 2023-02-22

### Added

- CHANGELOG.md according to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- Russian README. Follow https://github.com/jonatasemidio/multilanguage-readme-pattern
- `--no-warnings` to the `bin` script to suppress "ExperimentalWarning: Importing JSON modules is an experimental feature and might change at any time" warning (caused by [`webtorrent` code](https://github.com/webtorrent/webtorrent/blob/ffacc37a9b5993e41ff003c6a2bb2bef734576ac/index.js#L21))

### Changed

- Update dependencies
- Update GitHub Actions' workflows

### Fixed

- Exception when `--version` (`-v`) argument is set

### BREAKING CHANGES

- Require node version 18 and higher

## [v2.0.0](https://github.com/nikolay-borzov/torrent-clean/compare/v1.7.2...v2.0.0) - 2021-04-20

### Changed

- `deleteFiles` callback is always set. It does nothing when `dryRun` is falsy
- When creating config file set `.yaml` extension

### BREAKING CHANGES

- Switch to ECMAScript modules
- Require node version 12 and higher
- Rename main function to `cleanTorrentDirectory`
- Rename `dirPath` parameter to `directoryPath`

## [v1.7.2](https://github.com/nikolay-borzov/torrent-clean/compare/v1.7.1...v1.7.2) - 2020-10-03

### Fixed

- Ignore filename path case when comparing files in torrent with files on the file system

## [v1.7.1](https://github.com/nikolay-borzov/torrent-clean/compare/v1.7.0...v1.7.1) - 2020-04-24

### Fixed

- Fix infinite loop when a config file is at the root

## [v1.7.0](https://github.com/nikolay-borzov/torrent-clean/compare/v1.6.0...v1.7.0) - 2020-04-20

### Added

- Make package scoped. Use `@nikolay-borzov/torrent-clean` instead of `torrent-clean`
- Implement remembering last torrent ID for the specified directory. Setting `rememberLastTorrent: true` in config file makes `torrent-clean` save last torrent ID value to `lastTorrent` property inside config file. `lastTorrent` value is used when `--torrent` argument is not set.

### Changed

- Make `--torrent` and `torrentId` optional. Throw error when `torrentId` cannot be received from `lastTorrent` property
- Return "Parsed TORRENT_NAME" CLI output

## [v1.6.0](https://github.com/nikolay-borzov/torrent-clean/compare/v1.5.0...v1.6.0) - 2020-04-12

### Added

- Add Node API. Add `dryRun` options to postpone deleting files
- Set `tc` as alias for `torrent-clean`
- Add tests

### Changed

- Replace `recursive-readdir` with `readdirp`

## [v1.5.0](https://github.com/nikolay-borzov/torrent-clean/compare/v1.4.2...v1.5.0) - 2020-03-29

### Added

- Display file number near filename

## [v1.4.2](https://github.com/nikolay-borzov/torrent-clean/compare/v1.4.1...v1.4.2) - 2020-03-14

### Changed

- Update dependencies

## [v1.4.1](https://github.com/nikolay-borzov/torrent-clean/compare/v1.4.0...v1.4.1) - 2019-10-04

### Fixed

- Fix config loader for the case when `ignore` isn't set

## [v1.4.0](https://github.com/nikolay-borzov/torrent-clean/compare/v1.3.0...v1.4.0) - 2019-09-16

### Added

- Allow specifying ignore globs via config files
- Load and merge config files up to root directory using [`cosmiconfig`](https://github.com/cosmiconfig/cosmiconfig)
- Add `--version` (`-v`) CLI argument

### Changed

- Limit extra files display count to 20. You can scroll down using arrows
- Change file select indicator to `■`

## [v1.3.0](https://github.com/nikolay-borzov/torrent-clean/compare/v1.2.0...v1.3.0) - 2019-09-01

### Added

- Allow selecting files to delete

## [v1.2.0](https://github.com/nikolay-borzov/torrent-clean/compare/v1.1.0...v1.2.0) - 2019-01-09

### Added

- Add magnet URI and info hash support

## [v1.1.0](https://github.com/nikolay-borzov/torrent-clean/compare/v.1.0.0...v1.1.0) -

### Added

- Delete empty directories
- Limit filenames list output length to 20. Can be disabled by `--verbose` parameter
- Add colors using `chalk`
- Implement errors catching

## v1.0.0 - 2019-01-07

### Added

- Basic implementation for deleting files not listed in the torrent
