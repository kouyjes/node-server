const clone = require('clone');
exports.matchProxy = function (request) {

    const config = request.getContextConfig();
    var _proxy = config.proxy;
    var reqUrl = request._url;
    var proxies = [];

    if(_proxy instanceof Array){
        proxies = _proxy;
    }else if(_proxy){
        proxies.push(_proxy);
    }
    var proxy = null;
    proxies.some(function (p) {
        var pathRule = p.pathRule;
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
        proxy = clone(proxy);
        proxy.protocol = proxy.protocol || config.protocol || 'http';
        proxy.server = proxy.server || '127.0.0.1';
        proxy.port = proxy.port || config.port;
        proxy.headers = proxy.headers || {};
        proxy.url = encodeURI(proxy.url || reqUrl);
    }
    return proxy;
};