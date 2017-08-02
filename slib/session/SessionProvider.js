'use strict';
const logger = require('../logger/server-logger').getAppLogger();
const providers = {};
const providerPathMap = require('./impl.json');
class SessionProvider{
    static getProvider(config){

        var providerId = 'provider_' + config.port;
        var provider = providers[providerId];
        if(!provider){
            const sessionProvider = require(providerPathMap[config.session.provider.type || 'file']);
            provider = providers[providerId] = new sessionProvider(config);

        }
        return provider;
    }
    /**
     * get session from cache
     * @param sessionId
     * @param create default true,create a new Session if true when not exist!
     * @returns Session instance
     */
    getSession(sessionId,create){
        throw new Error('method is not implemented !');
    }
    /**
     * create a new session which id is sessionId
     * @param sessionId
     * @returns promise
     */
    createSession(sessionId){
        throw new Error('method is not implemented !');
    }
    syncSession(session,properties,waitSeconds){
        throw new Error('method is not implemented !');
    }
    invalidSession(session){
        throw new Error('method is not implemented !');
    }
}
module.exports = SessionProvider;