import * as localforage from 'localforage'
let localForage: LocalForage = localforage

const queryString = require('query-string')

export default class RecordLog {
  store: LocalForage
  screen: Screen
  navigator: Navigator
  server: string
  keyname: string = '__idebutxrkey__'
  constructor(window: Window, server: string) {
    this.screen = window.screen
    this.navigator = window.navigator
    this.server = server
    this.store = localforage.createInstance({
      name: 'idebut-xr-2022',
    })
  }
  send(message: string | object, authKey: string = null): object {
    const _ = this
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

    const headers: Headers = new Headers()
    if (authKey) {
      headers.append('Authorization', 'Bearer ' + authKey)
    }

    return fetch(`${this.server}?${queryString.stringify(info)}`, {
      ...(headers && { headers }),
    })
      .then((res: any) => res.json())
      .then(({ __seck, empty, err }) => {
        if ((empty && empty === true) || err) {
          return Promise.resolve(null)
        }
        return _.store.setItem(_.keyname, __seck)
      })
      .catch((err) => {
        console.error(err)
      })
  }
  async getKey() {
    let value: string = ''
    if (this.store) {
      value = await this.store.getItem(this.keyname)
    }
    return value
  }
}
