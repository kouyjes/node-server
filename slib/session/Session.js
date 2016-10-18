'use strict';
class Session{
    constructor(id,provider){
        this.id = id;
        this.provider = provider?provider:null;
    }
    getId(){
        return this.id;
    }
    update(){
        throw new Error('method is not implemented !');
    }

    /**
     * @param name
     * @param value
     * @returns {Promise}
     */
    setAttribute(name,value){
        throw new Error('method is not implemented !');
    }

    /**
     * set multi attributes
     * @param property
     * @returns {Promise}
     */
    setAttributes(property){
        throw new Error('method is not implemented !');
    }
    /**
     * @param name
     * @param sync
     * @returns {Promsie} if async is true else value of attribute
     */
    getAttribute(name,async){
        throw new Error('method is not implemented !');
    }

    /**
     * invalid session
     * @returns {Promise}
     */
    invalid(){
        throw new Error('method is not implemented !');
    }
    toString(){
        return JSON.stringify(this, function (key,val) {
            if(['id','provider'].indexOf(key) >= 0){
                return undefined;
            }else{
                return val;
            }
        });
    }
}
module.exports = Session;