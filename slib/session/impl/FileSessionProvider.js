'use strict';
const SessionProvider =  require('../SessionProvider');
const Session = require('./FileSession');
const fs = require('fs');
const logger = require('../../logger/server-logger').getAppLogger();
const Promise = require('promise');
class FileSessionProvider extends SessionProvider{
    constructor(config){
        super(config);
        var provider = config.session.provider;
        if(provider.dataFile){
            this.dataFile = provider.dataFile + config.port;
        }else{
            throw new Error('session provider type is file ,but dataFile is  invalid!');
        }

        this.sessionCache = {};
        this.sessionSyncRequest = null;
        this.fileWriteRunning = false;

        this.recover();

        this.initTimer(config);
    }
    initTimer(config){
        var provider = this;
        const timeout = config.session.timeout || 30;
        var checkInterval = 1000*Math.max(timeout*60/10,10);
        function checkSession(){
            var sessionCache = provider.sessionCache;
            for(let attr in sessionCache){
                if(!sessionCache.hasOwnProperty(attr)){
                    continue;
                }
                let session = sessionCache[attr];
                if(session && session.isTimeout(60*timeout)){
                    delete sessionCache[attr];
                    provider.persistRequest();
                }
            }
            setTimeout(checkSession,checkInterval);
        }
        checkSession();
    }
    /**
     * get session from cache
     * @param sessionId
     * @param create default true,create a new Session if true when not exist!
     * @returns Session instance
     */
    getSession(sessionId,create){
        var session = this.sessionCache[sessionId];
        create = (create !== false);
        if(create && !session){
            return this.createSession(sessionId);
        }
        var promise = new Promise(function (resolve) {
            resolve(session);
        }.bind(this));
        return promise;
    }
    /**
     * create a new session which id is sessionId
     * @param sessionId
     * @returns promise
     */
    createSession(sessionId){
        var session = this.sessionCache[sessionId] = new Session(sessionId,this);
        var promise = new Promise(function (resolve) {
            resolve(session);
        });
        this.persistRequest();
        return promise;
    }
    syncSession(session,properties,waitSeconds){
        return this.persistRequest(waitSeconds);
    }
    invalidSession(session){
        return this.persistRequest(1);
    }
    persistRequest(waitSeconds){
        if(this.sessionSyncRequest){
            clearTimeout(this.sessionSyncRequest);
        }
        this.sessionSyncRequest = setTimeout(function () {
            this.persist(JSON.stringify(this.sessionCache, function (key,val) {
                if(['id','time','provider'].indexOf(key) >= 0){
                    return undefined;
                }else{
                    return val;
                }
            }));
        }.bind(this),waitSeconds * 1000 || 10000);

        var promise = new Promise(function (resolve,reject) {
            resolve();
        });
        return promise;
    }
    persist(cacheString){
        if(this.fileWriteRunning){
            return;
        }
        this.fileWriteRunning = true;
        fs.writeFile(this.dataFile,cacheString, function (err) {
            this.fileWriteRunning = false;
            err && logger.error(err);
        }.bind(this));
    }
    dePersist(){
        var content = null,dataFile = this.dataFile;
        if(fs.existsSync(dataFile)){
            content = fs.readFileSync(dataFile);
            content = Buffer.from(content).toString('utf-8');
        }
        return content;
    }
    recover(){
        var content = this.dePersist();
        if(!content){
            return;
        }
        var result;
        try{
            result = JSON.parse(content);
        }catch (e){
            logger.error(e);
        }
        if(!result){
            return;
        }
        var sessionCache = this.sessionCache;
        for(let attr in result){
            if(!result.hasOwnProperty(attr)){
                continue;
            }
            let sessionObj = result[attr];
            let session = sessionCache[attr] = new Session(attr,this);
            if(sessionObj.attributes){
                session.attributes = sessionObj.attributes;
            }
        }
    }
}
module.exports = FileSessionProvider;