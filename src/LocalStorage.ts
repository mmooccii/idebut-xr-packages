import * as localforage from 'localforage'
import { Logger } from 'aws-amplify'

let localForage: LocalForage = localforage

export default class LocalStorage {
  store: null | LocalForage
  logger: Logger
  _options: any
  constructor(ctx: any) {
    this._options = ctx
    this.store = localforage.createInstance({
      name: 'useStore',
    })
    this.logger = new Logger('LocalStorage')
  }
  async set(key: string, value: object) {
    this.logger.debug('set value', key, value)
    return await this.store.setItem(key, value)
  }
  async get(key: string) {
    this.logger.debug('get value', key)
    return await this.store.getItem(key)
  }
  async remove(key: string) {
    this.logger.debug('remove value', key)
    return await this.store.removeItem(key)
  }
}
