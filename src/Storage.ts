import * as localforage from 'localforage';
import { Logger } from 'aws-amplify';

import {
	setCookies,
	getCookies,
	removeCookies,
	deleteCookie,
} from 'cookies-next';
import { OptionsType, TmpCookiesObj } from 'cookies-next/lib/types';
import { CookieSerializeOptions } from 'cookie';

import { get as getValue, set as setValue } from 'lodash';

let localForage: LocalForage = localforage;

function browserOrNode() {
	const isBrowser =
		typeof window !== 'undefined' && typeof window.document !== 'undefined';
	const isNode =
		typeof process !== 'undefined' &&
		process.versions != null &&
		process.versions.node != null;

	return {
		isBrowser,
		isNode,
	};
}

const { isBrowser } = browserOrNode();

export default class IdebutStorage {
	memory: { [key: string]: string };
	options: CookieSerializeOptions;
	store: null | LocalForage;
	ctx: OptionsType;
	logger: Logger;
	constructor(ctx: any) {
		ctx = ctx || {};
		const { data = {}, ...rest } = ctx;
		this.memory = {};
		this.options = {
			...(data.domain ? { domain: data.domain } : null),
			secure: getValue(data, 'secure', false),
			sameSite: true,
		};

		this.store = null;
		if (isBrowser) {
			this.store = localforage.createInstance({
				name: 'idebutxr',
			});
			this.ctx = {};
		} else {
			this.ctx = rest;
		}

		this.logger = new Logger('iDebut Storage');
		this.logger.debug(getCookies(this.ctx));
	}

	getItem(key: string) {
		this.logger.debug('get item ', key);
		return getValue(this.memory, key);
	}

	removeItem(key: string) {
		const _ = this;
		_.logger.debug('remove item ', key);

		delete this.memory[key];
		removeCookies(key, this.ctx);
		return Promise.all([_.asyncRemoveStoreItem(key)])
			.then(() => {})
			.catch(err => _.logger.error(err));
	}

	async asyncRemoveStoreItem(key: string) {
		try {
			this.logger.debug('async remove item ', key);
			if (this.store) return await this.store.removeItem(key);
		} catch (e) {
			this.logger.error(e);
		}
		return null;
	}

	clear() {
		this.logger.debug('Clear all items');

		this.memory = {};
		const cookies: TmpCookiesObj = getCookies(this.ctx);
		Object.keys(cookies).map(key => {
			if (typeof key === 'string') deleteCookie(key, this.ctx);
		});

		return Promise.all([this.clearStore()]).then(r => {
			this.logger.debug(r);
		});
	}

	async clearStore() {
		const store = this.store;
		if (store) {
			await store.clear();
		}
		return;
	}

	async key(index: number): Promise<number> {
		try {
			if (this.store !== null) {
				return parseInt(await this.store.key(index), 10);
			}
		} catch (e) {}
		return -1;
	}

	setItem(key: string, value: any) {
		const _ = this;
		_.logger.debug('set item ', key);
		_.setLocalItem(key, value);
		return Promise.all([this.setStoreItem(key, value)])
			.then(r => _.logger.debug(r))
			.catch(e => {
				_.logger.error(e);
			});
	}

	setLocalItem(key: string, value: any) {
		const _ = this;
		setValue(_.memory, key, value);
		const tokenType = key.split('.').pop();
		switch (tokenType) {
			case 'LastAuthUser':
			case 'accessToken':
			case 'refreshToken':
			case 'idToken':
				setCookies(key, value, { ..._.options, ..._.ctx });
		}
	}

	async setStoreItem(key: string, value: any) {
		const store = this.store;
		if (store) {
			try {
				await store.setItem(key, value);
				this.logger.debug(`async set item ${key}`);
				return key;
			} catch (e) {
				this.logger.error(e);
			}
		}
	}

	async sync() {
		this.logger.debug('Syncing...');
		try {
			await Promise.all([this.syncStore()]);
		} catch (e) {
			this.logger.error(e);
		}
		this.logger.debug('Syncing...done');
	}

	async syncStore() {
		if (this.store) {
			const self = this;
			const store = self.store;
			const memory = self.memory;
			const length = await store.length();
			if (length > 0) {
				self.logger.debug('Syncing store...start');
				try {
					await Promise.all(
						Array.from(new Array(length)).map(async (_, i) => {
							const key = await store.key(i);
							const value = await store.getItem(key);
							self.setLocalItem(key, value);
						})
					);
					self.logger.debug('Syncing store...done', length);
				} catch (e) {
					self.logger.error(e);
				}
			}
		}
	}
}
