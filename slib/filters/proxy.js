const http = require('http'),
    https = require('https'),
    fs = require('fs');
function proxy(chain,request,response){

    const config = request.getContextConfig();
    var proxy = config.proxy;
    var reqUrl = request.url;
    if(proxy && proxy instanceof Array){
        proxy.some(function (p) {
            if(p.pathRule && p.pathRule.test(reqUrl)){
                proxy = p;
                return true;
            }
        });
    }
    if(!proxy || !proxy.pathRule || !proxy.server || !reqUrl.match(new RegExp(proxy.pathRule))){
        chain.next();
        return;
    }

    var options = {
        hostname: proxy.server,
        port: proxy.port || config.port,
        path: reqUrl,
        method: request.method,
        headers: request.headers
    };

    var proxyClient = http;
    if(proxy.protocol === 'https'){
        if(!proxy.key || !proxy.cert){
            throw new TypeError('cert and key field must be config when protocol is https !');
        }
        if(!fs.existsSync(proxy.key)){
            throw new TypeError('key file is not exist ! ' + proxy.key);
        }
        if(!fs.existsSync(proxy.cert)){
            throw new TypeError('cert file is not exist ! ' + proxy.cert);
        }
        options.key = fs.readFileSync(proxy.key);
        options.cert = fs.readFileSync(proxy.cert);
        proxyClient = https;
    }

    var proxyRequest = proxyClient.request(options, function (res) {
        proxy.headers && Object.assign(res.headers || {},proxy.headers);
        response.writeHead(res.statusCode,res.headers);
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