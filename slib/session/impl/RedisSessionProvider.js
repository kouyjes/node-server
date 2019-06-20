'use strict';
const SessionProvider =  require('../SessionProvider');
const Session =  require('./RedisSession');
const logger = require('../../logger/server-logger').getAppLogger();
const Promise = require('promise');
function initRedisClient(config){
    const redis = require("redis");
    const provider = config.session.provider;
    const option = {
        host: provider.host
    };
    if(provider.port){
        option.port = provider.port;
    }
    if(provider.password){
        option.password = provider.password;
    }
    const redisClient = redis.createClient(option);
    return redisClient;
}
class RedisSessionProvider extends SessionProvider{
    constructor(config){
        super();
        this.sessionKey = 'nsession_' + config.port;

        this.redisClient = initRedisClient(config);

        this.sessionTimeout = config.session.timeout || 30;
    }
    /**
     * get session from cache
     * @param sessionId
     * @param create default true,create a new Session if true when not exist!
     * @returns Session instance
     */
    getSession(sessionId,create){
        const promise = new Promise(function (resolve, reject) {
            let session = null;
            try {
                this.redisClient.hgetall(this._getSessionKey(sessionId), function (err, obj) {
                    if (err) {
                        logger.error(err);
                    } else if (obj) {
                        session = new Session(sessionId, this);
                        for (let attr in obj) {
                            if (['id', 'provider'].indexOf(attr) >= 0) {
                                continue;
                            }
                            session.attributes[attr] = obj[attr];
                        }
                    }
                    if (!session && create === true) {
                        return this.createSession(sessionId);
                    }
                    resolve(session);
                }.bind(this));
            } catch (e) {
                logger.error(e);
            }
        }.bind(this));
        return promise;
    }
    getAttribute(sessionId,key){
        const promise = new Promise(function (resolve, reject) {
            this.redisClient.hget(this._getSessionKey(sessionId), key, function (err, value) {
                if (err) {
                    logger.error(err);
                    reject(err);
                    return;
                }
                resolve(value);
            })
        }.bind(this));
        return promise;
    }
    _getSessionKey(sessionId){
        return this.sessionKey + sessionId;
    }
    /**
     * create a new session which id is sessionId
     * @param sessionId
     * @returns promise
     */
    createSession(sessionId){
        const session = new Session(sessionId, this);
        const promise = this._syncString(this._getSessionKey(sessionId), 'id', session.getId()).then(function () {
            return session;
        });
        this.expireSession(sessionId);
        return promise;
    }
    _syncString(hid,key,value){
        const promise = new Promise(function (resolve, reject) {
            this.redisClient.hset(hid, key, value, function (err) {
                if (err) {
                    logger.error(err);
                    reject(err);
                    return;
                }
                logger.info(arguments);
                resolve();
            });
        }.bind(this));
        return promise;
    }
    _syncProperty(sessionId,properties){
        const hsetArgs = [this._getSessionKey(sessionId)];
        Object.keys(properties).forEach(function (key) {
            let value = properties[key];
            if(!value){
                value = '';
            }
            hsetArgs.push(key,value);
        }.bind(this));
        const promsie = new Promise(function (resolve, reject) {
            this.redisClient.hmset(hsetArgs, function (err) {
                if (err) {
                    logger.error(err);
                    reject(err);
                    return;
                }
                resolve();
            });
        }.bind(this));
        return promsie;
    }
    syncSession(session,properties,waitSeconds){
       return this._syncProperty(session.getId(),properties);
    }
    invalidSession(session){
        const delArgs = Object.keys(session.attributes);
        const promise = new Promise(function (resolve) {
            if (delArgs.length === 0) {
                resolve();
                return;
            }
            this.redisClient.hdel(this._getSessionKey(session.getId()), delArgs, function (err) {
                resolve();
                if (err) {
                    logger.error(err);
                    reject(err);
                }
            }.bind(this));
        }.bind(this));
        return promise;
    }
    expireSession(sessionId){
        this.redisClient.expire(this._getSessionKey(sessionId),this.sessionTimeout * 60);
    }
}
module.exports = RedisSessionProvider;