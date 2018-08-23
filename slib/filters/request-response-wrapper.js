const FS = require('fs'), PATH = require('path'), MIME = require('mime'), URL = require('url');
const zlib = require('zlib');
function sendError(errorCode, message) {
    if (!errorCode) {
        errorCode = 404;
    }
    if (!message) {
        message = '';
    }
    this.writeHead(errorCode, {'Content-Type': 'text/html'});
    this.end(message);
}
function outputStaticResource(absPath) {
    const _ = this;
    var mime = getMime(absPath);
    _.setHeader('Content-Type', mime);
    FS.exists(absPath, function (exists) {
        if (exists) {
            FS.createReadStream(absPath).pipe(_);
        } else {
            _.sendError(404, '404 error not found resource ');
        }
    });
}
function zipOutputStaticResource(absPath, encoding) {
    var _ = this;
    var readerStream = FS.createReadStream(absPath);
    var mime = getMime(absPath);
    _.setHeader('Content-Type', mime);
    if (encoding.match(/\bdeflate\b/)) {
        _.writeHead(200, {'Content-encoding': 'deflate'});
        readerStream.pipe(zlib.createDeflate()).pipe(_);
    } else if (encoding.match(/\bgzip\b/)) {
        _.writeHead(200, {'Content-encoding': 'gzip'});
        readerStream.pipe(zlib.createGzip()).pipe(_);
    } else {
        _.writeHead(200, {});
        readerStream.pipe(_);
    }
}
function zipOutputContent(mime, content, encoding) {

    const headers = {
        'Content-Type': mime
    };
    const _ = this;
    var output = content;
    _.setHeader('Content-Type', mime);
    if (encoding.match(/\bdeflate\b/)) {
        output = zlib.deflateSync(content);
        headers['Content-encoding'] = 'deflate';
    } else if (encoding.match(/\bgzip\b/)) {
        output = zlib.gzip(content);
        headers['Content-encoding'] = 'gzip';
    }
    _.writeHead(200, headers);
    _.end(output);
}
function outputContent(mime, content) {
    this.writeHead(200, {'Content-Type': mime});
    this.end(content);
}
async function outputFile(pathname, acceptEncoding) {
    const _ = this;
    var absPath = await _.findResourceByPathname(pathname);
    if (!absPath) {
        _.sendError(404, '404 error not found resource ');
        return;
    }
    if (acceptEncoding) {
        _.zipOutputStaticResource(absPath, acceptEncoding);
    } else {
        _.outputStaticResource(absPath);
    }
}
function getAttribute(requestCache) {
    return function (name) {
        return requestCache[name];
    };
}
function setAttribute(requestCache) {
    return function (name, value) {
        requestCache[name] = value;
        return this;
    }
}
function extendRequestResponse(request, response) {

    response.sendError = sendError;
    response.outputStaticResource = outputStaticResource;
    response.zipOutputStaticResource = zipOutputStaticResource;
    response.zipOutputContent = zipOutputContent;
    response.outputContent = outputContent;
    response.outputFile = outputFile;

    var requestCache = {};
    request.getAttribute = getAttribute(requestCache);
    request.setAttribute = setAttribute(requestCache);

    request.redirectUrl = redirectUrl;
}
function redirectUrl(url) {
    this._url = url;
    parseUrl(this);
}
function getMime(absPath) {
    var mime = MIME.getType(PATH.basename(absPath));
    if (!mime) {
        mime = 'text/html';
    }
    return mime;
}
function parseUrl(request) {
    const urlInfo = URL.parse(request._url);
    var pathname = PATH.normalize(urlInfo.pathname);
    pathname = pathname.replace(/\\/g,'/');
    request.pathname = pathname;

    if(urlInfo.pathname !== request.pathname){
        console.error('invalid request path :' + urlInfo.pathname);
    }

    var queryParam = request.queryParam = {};
    var query = urlInfo.query;
    query && query.split('&').forEach(function (querySection) {
        var param = querySection.split('=');
        if (param.length < 2) {
            return;
        }
        var paramObj = queryParam[param[0]];
        if (paramObj) {
            queryParam[param[0]] = [paramObj].concat(param[1]);
        } else {
            queryParam[param[0]] = param[1];
        }
    });
}
function wrapperRequestResponse(chain, request, response) {

    const config = request.getContextConfig();
    if (!response.setHeader) {
        response.setHeader = function () {
        };
    }
    response.setHeader('Server', config.serverName);
    request._url = decodeURIComponent(request.url);
    parseUrl(request);

    extendRequestResponse(request, response);

    chain.next();
}
wrapperRequestResponse.priority = 100;
module.exports.execute = wrapperRequestResponse;