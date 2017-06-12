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
        var promise = this.provider.invalidSession(this);
        var attributes = this.attributes;
        var keys = Object.keys(attributes);
        keys.forEach(function (key) {
            delete attributes[key];
        });
        return promise;
    }
}
module.exports = RedisSession;