const proxyUtil = require('./proxyUtil');
function proxy(chain,request){

    var proxy = proxyUtil.matchProxy(request);

    if(!proxy){
        chain.next();
        return;
    }

    const config = request.getContextConfig();
    var hostname = proxy.server;
    var proxyPort = proxy.port;

    var isSameProtocol = proxy.protocol === config.protocol,
        isSamePort = proxyPort === config.port;
    if(isSameProtocol && isSamePort && (['localhost','127.0.0.1'].indexOf(hostname) >= 0)){
        request.redirectUrl(proxy.url);
    }
    chain.next();
}
proxy.priority = 99.9;
exports.execute = proxy;