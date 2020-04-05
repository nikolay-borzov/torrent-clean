const { MultiSelect } = require('enquirer')
const utils = require('enquirer/lib/utils')

module.exports = class FilesSelect extends MultiSelect {
  constructor(options) {
    super(options)

    this.digitsCount = (Math.log10(options.choices.length) + 1) | 0
  }

  // https://github.com/enquirer/enquirer/blob/master/lib/prompts/select.js#L46
  async renderChoice(choice, i) {
    await this.onChoice(choice, i)

    const focused = this.index === i
    const pointer = await this.pointer(choice, i)
    const check = (await this.indicator(choice, i)) + (choice.pad || '')
    let hint = await this.resolve(choice.hint, this.state, choice, i)

    if (hint && !utils.hasColor(hint)) {
      hint = this.styles.muted(hint)
    }

    const ind = this.indent(choice)
    let msg = await this.choiceMessage(choice, i)

    const choiceNumber = `${(choice.index + 1)
      .toString()
      .padStart(this.digitsCount)}|`

    const line = () =>
      [
        this.margin[3],
        ind + pointer + check,
        choiceNumber,
        msg,
        this.margin[1],
        hint,
      ]
        .filter(Boolean)
        .join(' ')

    if (choice.role === 'heading') {
      return line()
    }

    if (choice.disabled) {
      if (!utils.hasColor(msg)) {
        msg = this.styles.disabled(msg)
      }
      return line()
    }

    if (focused) {
      msg = this.styles.em(msg)
    }

    return line()
  }
}
