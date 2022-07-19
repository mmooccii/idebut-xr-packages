import * as localforage from 'localforage'
import { Logger } from 'aws-amplify'

import { setCookie, getCookies, deleteCookie } from 'cookies-next'

import { OptionsType, TmpCookiesObj } from 'cookies-next/lib/types'
import { CookieSerializeOptions } from 'cookie'

import { browserOrNode } from './_tools'

import { get as getValue, set as setValue, unset as unsetValue } from 'lodash'

let localForage: LocalForage = localforage

const { isBrowser } = browserOrNode()
const CookiePrefix = 'CognitoIdentityServiceProvider'

export default class IdebutStorage {
  memory: { [key: string]: string }
  options: CookieSerializeOptions
  store: null | LocalForage
  cookie_prefix: string
  ctx: OptionsType
  logger: Logger
  constructor(ctx: any) {
    ctx = ctx || {}
    const { data = {}, ...rest } = ctx
    this.memory = {}
    this.options = {
      ...(data.domain ? { domain: data.domain } : null),
      secure: getValue(data, 'secure', false),
      sameSite: true,
    }

    this.store = null
    if (isBrowser) {
      this.store = localforage.createInstance({
        name: 'idebutxr',
      })
      this.ctx = {}
    } else {
      this.ctx = rest
    }

    if (ctx.cookie_prefix) {
      this.cookie_prefix = `${CookiePrefix}.${ctx.cookie_prefix}`
    } else {
      this.cookie_prefix = `${CookiePrefix}`
    }

    this.logger = new Logger('iDebut Storage')
    this.logger.debug(getCookies(this.ctx))
  }

  getItem(key: string) {
    this.logger.debug('get item ', key)
    return getValue(this.memory, key)
  }

  removeItem(key: string) {
    const _ = this
    _.logger.debug('remove item ', key)

    unsetValue(this.memory, key)
    this.logger.debug('remove item', this.memory)
    deleteCookie(key, this.ctx)
    return Promise.all([_.asyncRemoveStoreItem(key)])
      .then((r: any) => {
        console.log(r)
      })
      .catch((err) => _.logger.error(err))
  }

  async asyncRemoveStoreItem(key: string): Promise<void> {
    try {
      if (this.store) await this.store.removeItem(key)
      this.logger.debug('async remove item ', key)
    } catch (e) {
      this.logger.error(e)
    }
  }

  clear() {
    this.logger.debug('Clear all items')

    this.memory = {}
    const cookies: TmpCookiesObj = getCookies(this.ctx)
    Object.keys(cookies).map((key) => {
      if (typeof key === 'string') deleteCookie(key, this.ctx)
    })

    return Promise.all([this.clearStore()]).then((r) => {
      this.logger.debug(r)
    })
  }

  async clearStore() {
    const store = this.store
    if (store) {
      await store.clear()
    }
    return
  }

  async key(index: number): Promise<number> {
    try {
      if (this.store !== null) {
        return parseInt(await this.store.key(index), 10)
      }
    } catch (e) {}
    return -1
  }

  setItem(key: string, value: any) {
    const _ = this
    _.logger.debug('set item ', key)
    _.setLocalItem(key, value)
    return Promise.all([this.setStoreItem(key, value)])
      .then((r) => _.logger.debug(r))
      .catch((e) => {
        _.logger.error(e)
      })
  }

  setLocalItem(key: string, value: any) {
    const _ = this
    setValue(_.memory, key, value)
    if (key.startsWith(_.cookie_prefix)) {
      const tokenType = key.split('.').pop()
      switch (tokenType) {
        case 'LastAuthUser':
        case 'accessToken':
        case 'refreshToken':
        case 'idToken':
          setCookie(key, value, { ..._.options, ..._.ctx })
      }
    }
  }

  async setStoreItem(key: string, value: any) {
    const store = this.store
    if (store) {
      try {
        await store.setItem(key, value)
        this.logger.debug(`async set item ${key}`)
        return key
      } catch (e) {
        this.logger.error(e)
      }
    }
  }

  async sync() {
    this.logger.debug('Syncing...')
    try {
      await Promise.all([this.syncStore()])
    } catch (e) {
      this.logger.error(e)
    }
    this.logger.debug('Syncing...done')
  }

  async syncStore() {
    if (this.store) {
      const self = this
      const store = self.store
      const length = await store.length()
      if (length > 0) {
        self.logger.debug('Syncing store...start')
        try {
          await Promise.all(
            Array.from(new Array(length)).map(async (_, i) => {
              const key = await store.key(i)
              const value = await store.getItem(key)
              self.setLocalItem(key, value)
            })
          )
          self.logger.debug('Syncing store...done', length)
        } catch (e) {
          self.logger.error(e)
        }
      }
    }
  }
}
