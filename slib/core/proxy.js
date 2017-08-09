function proxy(source,targetObject){
    return new Proxy(source,{
        get: function (target,key) {
            var value = Reflect.get(target, key, target);
            if(value !== void 0){
                return value;
            }
            value = Reflect.get(targetObject, key, targetObject);
            if(typeof value === 'function'){
                value = value.bind(targetObject);
            }
            return value;
        },
        set: function (target,key,value) {
            var _v =  Reflect.get(targetObject, key, targetObject);
            if(_v !== void 0){
                Reflect.set(targetObject,key,value, targetObject);
            }else{
                Reflect.set(target,key,value, target);
            }
            return true;
        }
    });
}
exports.proxy = proxy;