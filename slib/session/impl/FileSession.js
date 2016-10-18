'use strict';
const Session = require('../Session');
const Promise = require('promise');
class FileSession extends Session{
    constructor(id,provider){
        super(id,provider);
        this.attributes = {};
        this.time = {
            modifiedDate:new Date()
        }
    }
    setAttribute(name,value){
        this.attributes[name] = value;
        var property = {};
        property[name] = value;
        return this.provider.syncSession(this,property);
    }
    setAttributes(property){
        for(let attr in property){
            this.attributes[attr] = property[attr];;
        }
        return this.provider.syncSession(this,property);
    }
    _getSyncAttrbute(name){
        var promise = new Promise(function (resolve,reject) {
            resolve(this.getAttribute(name));
        }.bind(this));
        return promise;
    }
    getAttribute(name,async){
        if(async){
            return this._getSyncAttrbute(name);
        }
        return this.attributes[name];
    }
    invalid(){
        var attributes = this.attributes;
        var keys = Object.keys(attributes);
        keys.forEach(function (key) {
            delete attributes[key];
        });
        return this.provider.invalidSession(this);
    }
    update (){
        this.time.modifiedDate = new Date();
    }
    /**
     * return true if session is timeout
     * @param timeout senconds
     * @returns {boolean}
     */
    isTimeout (timeout){
        return ((new Date()).getTime() - this.time.modifiedDate.getTime())/1000 > timeout;
    }
    toString(){
        return JSON.stringify(this, function (key,val) {
            if(['id','time','provider'].indexOf(key) >= 0){
                return undefined;
            }else{
                return val;
            }
        });
    }
}
module.exports = FileSession;