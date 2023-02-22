# torrent-clean

[![en](https://img.shields.io/badge/lang-en-%233c3b6e)](./README.md)
[![ru](https://img.shields.io/badge/lang-ru-%23d52b1e)](./README.ru.md)

[![NPM version][npm-image]][npm-url]
![][ci-image]
[![Inline docs][docs-image]][docs-url]
[![Known Vulnerabilities][vulnerabilities-image]][vulnerabilities-url]
[![Maintainability][maintability-image]][maintability-url]
[![Style Guide][style-guide-image]][style-guide-url]
[![Test Coverage][test-coverage-image]][test-coverage-url]

[npm-image]: https://img.shields.io/npm/v/@nikolay-borzov/torrent-clean.svg
[npm-url]: https://npmjs.org/package/@nikolay-borzov/torrent-clean
[ci-image]: https://github.com/nikolay-borzov/torrent-clean/workflows/CI/badge.svg
[docs-image]: https://inch-ci.org/github/nikolay-borzov/torrent-clean.svg?branch=master
[docs-url]: https://inch-ci.org/github/nikolay-borzov/torrent-clean
[vulnerabilities-image]: https://snyk.io/test/github/nikolay-borzov/torrent-clean/badge.svg?targetFile=package.json
[vulnerabilities-url]: https://snyk.io/test/github/nikolay-borzov/torrent-clean?targetFile=package.json
[maintability-image]: https://api.codeclimate.com/v1/badges/093465c943260646aa40/maintainability
[maintability-url]: https://codeclimate.com/github/nikolay-borzov/torrent-clean/maintainability
[style-guide-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[style-guide-url]: https://standardjs.com
[test-coverage-image]: https://api.codeclimate.com/v1/badges/093465c943260646aa40/test_coverage
[test-coverage-url]: https://codeclimate.com/github/nikolay-borzov/torrent-clean/test_coverage

Консольная утилита позволяющая удалять файлы, отсутствующие в указанном торренте. Полезно для случаев, когда после обновления торрента некоторые файлы были удалены.

## Пререквизиты

- Node.js 18 и новее

## Установка

```
npm i -g @nikolay-borzov/torrent-clean
```

## Использование

```
C:\Загрузки\Пак обоев - Природа\torrent-clean -t C:\Торренты\nature-pack.torrent
```

извлекает список файлов из `nature-pack.torrent` и сравнивает его со списком файлов директории `C:\Загрузки\Пак обоев - Природа\`. Файлы не указанные в `nature-pack.torrent` могут быт удалены.

У команды `torrent-clean` есть короткая форма - `tc`.

## Аргументы командной строки

`--torrent` (или `-t`) - ID торрента (как описано в [webtorrent api](https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-))

- Magnet-ссылка (например `magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36`)
- Хэш (например `d2474e86c95b19b8bcfdb92bc12c9d44667cfa36`)
- http/https URL торрент файла
- Путь к торрент файлу в файловой системе

`--dir` (или `-d`) - Путь к директории со скаченными файлами торрента

`--version` - Выводит версию приложения

## Файлы предустановок

`torrent-clean` позволяет задать часть параметров через файл предустановок (`.torrent-cleanrc`, `.torrent-cleanrc.json`, `.torrent-cleanrc.yaml`, `.torrent-cleanrc.yml`). Поддерживаются множество файлов на пути к целевой директории - `torrent-clean` соберёт и скомбинирует все файлы предустановок вплоть до корневой директории. Чем ближе файл к целевой директории, тем выше его приоритет.

Параметры следующие:

- `ignore: string[]` - Массив паттернов имён файлов (globs) (используется [picomatch](https://github.com/micromatch/picomatch#globbing-features)) или имён файлов, которые будут исключены и списка «лишних» файлов.
- `rememberLastTorrent: boolean` - Включает функцию запоминания последнего указанного торрента для конкретной директории в параметре `lastTorrent`. Сохраняются только строковые значения. Параметр `lastTorrent` используется, когда не указан аргумент `--torrent`.

## API

Функция `cleanTorrentDirectory` принимает объект параметров:

```javascript
{
  torrentId: '6a9759bffd5c0af65319979fb7832189f4f3c35d',
  // Директория для очистки
  directoryPath: 'C:/Загрузки/Обои/Природа',
  // Не удалять файлы сразу. Вместо этого будет возвращена функция `deleteFiles`
  dryRun: true,
  // Объект предустановок с высшим приоритетом
  customConfig: { ignore: ['**/*\(правка\)*'] },
  // Вызывается после загрузки файло предустановок
  onConfigLoaded({ torrent }) { console.log(`Обработан ${torrent}`) }
}
```

```javascript
import { cleanTorrentDirectory } from 'torrent-clean'

const { extraFiles } = await cleanTorrentDirectory({
  torrentId: 'C:/Торренты/nature wallpapers.torrent',
  directoryPath: 'C:/Загрузки/Обои/Природа',
})

console.log('Удалено', extraFiles)
```

```javascript
import cleanTorrentDirectory from 'torrent-clean'

const { extraFiles, deleteFiles } = await cleanTorrentDirectory({
  torrentId: '6a9759bffd5c0af65319979fb7832189f4f3c35d',
  directoryPath: 'C:/Загрузки/Обои/Природа',
  dryRun: true,
  customConfig: { ignore: ['**/*(правка)*'] },
})

console.log('Удаляю', extraFiles)

await deleteFiles(extraFiles)
```

## Известные проблемы

- Торренты файлы, имя которых содержит некоторые Unicode символы (например 𝗚𝗪𝗔 1.txt), не могут быть обработаны.
- Иногда обработка торрента указанного как хэш зависает. Лучше всего указывать локальный путь к торрент файлу.

### Создано с помощью

- [webtorrent](https://github.com/webtorrent/webtorrent)
- [minimist](https://github.com/substack/minimist)
- [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig)
- [enquirer](https://github.com/enquirer/enquirer)
- [readdirp](https://github.com/paulmillr/readdirp)
- [picomatch](https://github.com/micromatch/picomatch)
- [delete-empty](https://github.com/jonschlinkert/delete-empty)
- [chalk](https://github.com/chalk/chalk)
