'use strict';
const logger = require('./logger/server-logger').getAppLogger();
const NodeCache = require("node-cache");

const Promise = require('promise');
class XCache {
    constructor() {
        this.cacheProvider = new NodeCache();
    }

    set(key, value, timeout) {
        this.cacheProvider.set(key, value, timeout);
    }

    get(key) {
        const _ = this;
        const promise = new Promise(function (resolve, reject) {
            _.cacheProvider.get(key, function (err, value) {
                if (!err) {
                    resolve(value);
                } else {
                    logger.error(err);
                    reject(err);
                }
            });
        });
        return promise;
    }

    syncGet(key) {
        return this.cacheProvider.get(key);
    }

    del(key) {
        this.cacheProvider.del(key);
    }

    close() {
        this.cacheProvider.close();
    }

    flushAll() {
        this.cacheProvider.flushAll();
    }
}
module.exports = XCache;

