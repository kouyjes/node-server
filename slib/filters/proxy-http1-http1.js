const http = require('http'),
    https = require('https'),
    fs = require('fs');

const proxyUtil = require('./proxyUtil');
function proxy(chain,request,response){

    const config = request.getContextConfig();

    var allowProtocols = ['http','https'];
    if(allowProtocols.indexOf(config.protocol) === -1){
        chain.next();
        return;
    }
    var proxy = proxyUtil.matchProxy(request);
    if(!proxy || allowProtocols.indexOf(proxy.protocol) === -1){
        chain.next();
        return;
    }

    var options = {
        hostname: proxy.server,
        port: proxy.port,
        path: proxy.url,
        method: request.method,
        headers: Object.assign(request.headers,proxy.headers)
    };
    var proxyClient = http;
    function configKeyCert(){
        if(proxy.key && fs.existsSync(proxy.key)){
            options.key = fs.readFileSync(proxy.key);
        }
        if(proxy.cert && fs.existsSync(proxy.cert)){
            options.cert = fs.readFileSync(proxy.cert);
        }
    }
    if(proxy.protocol === 'https'){
        configKeyCert();
        if(typeof proxy.rejectUnauthorized === 'boolean'){
            options.rejectUnauthorized = proxy.rejectUnauthorized;
        }else{
            options.rejectUnauthorized = false;
        }
        proxyClient = https;
    }
    var proxyRequest = proxyClient.request(options, function (res) {
        var headers = res.headers || {};
        response.writeHead(res.statusCode,headers);
        res.on('data', function (data) {
            response.write(data);
        }).on('end', function () {
            response.end();
        });
    }).on('error', function (e) {
        if(response.finished){
           return;
        }
        response.sendError(500,JSON.stringify(e));
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