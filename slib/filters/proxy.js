var _http2;
try{
    _http2 = require('http2');
}catch(e){
}
const http = require('http'),
    https = require('https'),
    fs = require('fs');
const http2 = _http2;
function proxy(chain,request,response){

    const config = request.getContextConfig();
    var _proxy = config.proxy;
    var reqUrl = request.url;
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
    if(!proxy){
        chain.next();
        return;
    }
    var proxyHeaders = proxy.headers || {};
    var options = {
        hostname: proxy.server || '127.0.0.1',
        port: proxy.port || config.port,
        path: proxy.url || reqUrl,
        method: request.method,
        headers: Object.assign(request.headers,proxyHeaders)
    };
    if(!proxy.protocol){
        proxy.protocol = config.protocol || 'http';
    }
    var isSameProtocol = proxy.protocol === config.protocol,
        isSamePort = options.port === config.port;
    if(isSameProtocol && isSamePort && (!options.hostname || ['localhost','127.0.0.1'].indexOf(options.hostname) >= 0)){
        request.redirectUrl(options.path);
        chain.next();
        return;
    }
    var proxyClient = http;
    function checkKeyCert(){
        if(!proxy.key || !proxy.cert){
            throw new TypeError('cert and key field must be config when protocol is https or http2!');
        }
        if(!fs.existsSync(proxy.key)){
            throw new TypeError('key file is not exist ! ' + proxy.key);
        }
        if(!fs.existsSync(proxy.cert)){
            throw new TypeError('cert file is not exist ! ' + proxy.cert);
        }
        options.key = fs.readFileSync(proxy.key);
        options.cert = fs.readFileSync(proxy.cert);
    }
    if(proxy.protocol === 'https'){
        checkKeyCert();
        if(typeof proxy.rejectUnauthorized === 'boolean'){
            options.rejectUnauthorized = proxy.rejectUnauthorized;
        }
        proxyClient = https;
    }else if(proxy.protocol === 'http2'){
        response.sendError(500,'protocol http2 proxy not supported !');
        return;
    }

    var proxyRequest = proxyClient.request(options, function (res) {
        response.writeHead(res.statusCode,res.headers || {});
        res.on('data', function (data) {
            response.write(data);
        }).on('end', function () {
            response.end();
        });
    }).on('error', function (e) {
        if(response.finished){
           return;
        }
        response.sendError(500,'proxy request error !' + JSON.stringify(e));
    });
    if(typeof proxy.timeout === 'number'){
        proxyRequest.setTimeout(proxy.timeout, function () {
            response.sendError(500,'proxy request timeout! IP:' + options.hostname + ' PORT:' + options.port);
            proxyRequest.abort();
        });
    }
    request.on('data', function (data) {
        proxyRequest.write(data);
    });
    request.on('end', function () {
        proxyRequest.end();
    });
}
proxy.priority = 99;
exports.execute = proxy;