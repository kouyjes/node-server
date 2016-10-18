'use strict';
const logger = require('./server-logger').getLogger();
var NodeCache = require( "node-cache" );

const Promise = require('promise');
class XCache{
    constructor(){
        this.cacheProvider = new NodeCache();
    }
    set(key,value,timeout){
        this.cacheProvider.set( key, value,timeout);
    }
    get(key){
        var promise = new Promise(function (resolve, reject) {
            this.cacheProvider.get( key,function( err, value ){
                if( !err && value){
                    resolve(value);
                }else{
                    logger.error(err);
                    reject(err);
                }
            });
        });
        return promise;
    }
    syncGet(key){
        return this.cacheProvider.get(key);
    }
    del(key){
        this.cacheProvider.del(key);
    }
    close(){
        this.cacheProvider.close();
    }
    flushAll(){
        this.cacheProvider.flushAll();
    }
}
module.exports = XCache;

