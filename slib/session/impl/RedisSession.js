'use strict';
const Session = require('../Session');
class RedisSession extends Session{
    constructor(id,provider){
        super(id,provider);
        this.attributes = {};
    }
    update(){
       this.provider.expireSession(this.id);
    }
    setAttribute(name,value){
        this.attributes[name] = value;
        const property = {};
        property[name] = value;
        return this.provider.syncSession(this,property);
    }
    setAttributes(property){
        for(let attr in property){
            this.attributes[attr] = property[attr];;
        }
        return this.provider.syncSession(this,property);
    }
    _getSyncAttribute(name){
        return this.provider.getAttribute(name);
    }
    getAttribute(name,async){
        if(async){
            return this._getSyncAttribute(name);
        }
        return this.attributes[name];
    }
    invalid(){
        const promise = this.provider.invalidSession(this);
        const attributes = this.attributes;
        const keys = Object.keys(attributes);
        keys.forEach(function (key) {
            delete attributes[key];
        });
        return promise;
    }
}
module.exports = RedisSession;