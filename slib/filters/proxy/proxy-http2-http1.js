const http = require('http'),
    https = require('https'),
    fs = require('fs');
const proxyUtil = require('./proxyUtil');
function proxy(chain,request,response){

    const config = request.getContextConfig();

    if(config.protocol !== 'http2'){
        chain.next();
        return;
    }
    const proxy = proxyUtil.matchProxy(request);
    if(!proxy || ['http','https'].indexOf(proxy.protocol) === -1){
        chain.next();
        return;
    }

    const options = {
        hostname: proxy.server,
        port: proxy.port,
        path: proxy.url,
        method: request.method,
        headers: Object.assign(request.headers, proxy.headers)
    };
    let proxyClient = http;

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
    if(config.protocol === 'http2'){
        const headers = {};
        Object.keys(options.headers).map(function (headerName) {
            const _headerName = headerName.replace(/^:/, '');
            headers[_headerName] = options.headers[headerName];
        });
        options.headers = headers;
    }

    const proxyRequest = proxyClient.request(options, function (res) {
        if (response.finished) {
            return;
        }
        const headers = Object.assign({}, res.headers);
        ['connection', 'method', 'path', 'transfer-encoding'].forEach(function (key) {
            delete headers[key];
        });
        response.writeHead(res.statusCode, headers);
        res.on('data', function (data) {
            if (response.finished) {
                return;
            }
            response.write(data);
        }).on('end', function () {
            if (!response.finished) {
                response.end();
            }
        });
    }).on('error', function (e) {
        if (response.finished) {
            return;
        }
        response.sendError(500, JSON.stringify(e));
    });
    if(typeof proxy.timeout === 'number'){
        proxyRequest.setTimeout(proxy.timeout, function () {
            if(response.finished){
                return;
            }
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
    request.on('abort',function(){
        proxyRequest.abort();
    }).on('timeout',function(){
        proxyRequest.abort();
    }).on('close',function(){
        proxyRequest.abort();
    });
}
proxy.priority = 99;
exports.execute = proxy;