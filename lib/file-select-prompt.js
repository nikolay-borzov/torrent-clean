import enquirer from 'enquirer'
import utils from 'enquirer/lib/utils.js'

const { MultiSelect } = enquirer

export class FilesSelect extends MultiSelect {
  constructor(options) {
    super(options)

    this.digitsCount = Math.trunc(Math.log10(options.choices.length) + 1)
  }

  // https://github.com/enquirer/enquirer/blob/master/lib/prompts/select.js#L46
  async renderChoice(choice, index) {
    await this.onChoice(choice, index)

    const focused = this.index === index
    const pointer = await this.pointer(choice, index)
    const check = (await this.indicator(choice, index)) + (choice.pad || '')
    let hint = await this.resolve(choice.hint, this.state, choice, index)

    if (hint && !utils.hasColor(hint)) {
      hint = this.styles.muted(hint)
    }

    const ind = this.indent(choice)
    let message = await this.choiceMessage(choice, index)

    const choiceNumber = `${(choice.index + 1)
      .toString()
      .padStart(this.digitsCount)}|`

    const line = () =>
      [
        this.margin[3],
        ind + pointer + check,
        choiceNumber,
        message,
        this.margin[1],
        hint,
      ]
        .filter(Boolean)
        .join(' ')

    if (choice.role === 'heading') {
      return line()
    }

    if (choice.disabled) {
      if (!utils.hasColor(message)) {
        message = this.styles.disabled(message)
      }

      return line()
    }

    if (focused) {
      message = this.styles.em(message)
    }

    return line()
  }
}
