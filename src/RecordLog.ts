const queryString = require('query-string')

export default class RecordLog {
  screen: Screen
  navigator: Navigator
  server: String
  constructor(window: Window, server: string) {
    this.screen = window.screen
    this.navigator = window.navigator
    this.server = server
  }
  send(message: string | object): object {
    const info: object = {
      m: this.navigator.mimeTypes.length,
      p: this.navigator.plugins.length,
      _w: this.screen.width,
      _h: this.screen.height,
      _p: this.screen.pixelDepth,
      msg:
        typeof message === 'string'
          ? message
          : encodeURIComponent(JSON.stringify(message)),
    }

    return fetch(`${this.server}?${queryString.stringify(info)}`).then((res) =>
      res.json()
    )
  }
}
