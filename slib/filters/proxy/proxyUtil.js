const clone = require('clone');
const logger = require('../../logger/server-logger').getAppLogger();
function parseScript(scripts){
    let fn = null;
    if(typeof scripts === 'string'){
        try{
            fn = new Function('request',scripts);
        }catch(e){
            logger.error(e);
        }
    }
    return fn;
}
exports.matchProxy = function (request) {

    const config = request.getContextConfig();
    const _proxy = config.proxy;
    const reqUrl = request._url;
    let proxies = [];

    if(_proxy instanceof Array){
        proxies = _proxy;
    }else if(_proxy){
        proxies.push(_proxy);
    }
    let proxy = null;
    proxies.some(function (p) {
        let matchScript = p.matchScript;
        if(typeof matchScript === 'string'){
            p.matchScriptFn = parseScript(matchScript);
            delete p.matchScript;
        }
        if(typeof p.matchScriptFn === 'function'){
            try{
                return p.matchScriptFn.call(null,request);
            }catch(e){
                logger.error(e);
            }
        }
        let pathRule = p.pathRule;
        if(typeof pathRule === 'string'){
            pathRule = new RegExp(pathRule);
        }
        if(!(pathRule instanceof RegExp)){
            return;
        }
        if(pathRule && pathRule.test(reqUrl)){
            proxy = p;
            return true;
        }
    });
    if(proxy){
        let scripts = proxy.scripts;
        if(typeof scripts === 'string'){
            proxy.scriptFn = parseScript(scripts);
            delete proxy.scripts;
        }
        proxy = clone(proxy);
        proxy.protocol = proxy.protocol || config.protocol || 'http';
        proxy.server = proxy.server || '127.0.0.1';
        proxy.port = proxy.port || config.port;
        proxy.headers = proxy.headers || {};
        let remoteAddress = request.socket.remoteAddress;
        if(typeof remoteAddress === 'string'){
            remoteAddress = remoteAddress.replace(/^::f{4}:/,'')
        }
        if(remoteAddress){
            proxy.headers['X-Forward-For'] = remoteAddress;
        }
        proxy.url = encodeURI(proxy.url || reqUrl);
        if(typeof proxy.scriptFn === 'function'){
            try{
                proxy.scriptFn.call(null,request);
            }catch(e){
                logger.error(e);
            }
        }
    }
    return proxy;
};