const http = require('http');
function proxy(chain,request,response,config){
    var proxy = config.proxy;
    var reqUrl = request.pathname;
    if(proxy && proxy instanceof Array){
        proxy.some(function (p) {
            if(p.pathRule && p.pathRule.test(reqUrl)){
                proxy = p;
                return true;
            }
        });
    }
    if(!proxy || !proxy.pathRule || !proxy.server || !proxy.pathRule.test(reqUrl)){
        chain.next();
        return;
    }

    var options = {
        hostname: proxy.server,
        port: proxy.port || config.port,
        path: reqUrl,
        method: request.method,
        headers: request.headers,
        timeout: proxy.timeout
    };
    var proxyRequest = http.request(options, function (res) {
        response.writeHead(res.statusCode,res.headers);
        res.on('data', function (data) {
            response.write(data);
        }).on('end', function () {
            response.end();
        }).on('timeout', function () {
            response.sendError(401,'proxy request timeout !');
        }).on('error', function (e) {
            response.sendError(500,'proxy request error !' + JSON.stringify(e));
        })
    });
    request.on('data', function (data) {
        proxyRequest.write(data);
    });
    request.on('end', function () {
        proxyRequest.end();
    });
}
proxy.priority = 99;
exports.execute = proxy;