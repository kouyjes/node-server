'use strict';
const logger = require('./logger/server-logger').getAppLogger();
var NodeCache = require("node-cache");

const Promise = require('promise');
class XCache {
    constructor() {
        this.cacheProvider = new NodeCache();
    }

    set(key, value, timeout) {
        this.cacheProvider.set(key, value, timeout);
    }

    get(key) {
        var _ = this;
        var promise = new Promise(function (resolve, reject) {
            _.cacheProvider.get(key, function (err, value) {
                if (!err && value) {
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

