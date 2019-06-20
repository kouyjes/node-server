const FS = require('fs'), PATH = require('path'), MIME = require('mime');
const XCache = require('../cache');
const filePathCache = new XCache();
const Constants = require('../config/Constants');
const Promise = require('promise');
function getMime(absPath) {
    let mime = MIME.getType(PATH.basename(absPath));
    if (!mime) {
        mime = 'text/html';
    }
    return mime;
}
function checkContextPath(pathname, contextPath) {
    if (!pathname.startsWith(contextPath)) {
        return false;
    }
    pathname = pathname.substring(contextPath.length);
    pathname = pathname.replace(/^\/+/, '');
    return pathname;
}
function appendDirIndexFile(absPath) {
    if(!absPath.endsWith('/')){
        absPath += '/';
    }
    absPath = absPath + 'index.html';
    return absPath;
}
function sendError(errorCode, message) {
    if(this.finished){
        return;
    }
    if(this.headersSent){
        this.end();
        return;
    }
    if (!errorCode) {
        errorCode = 404;
    }
    if (!message) {
        message = '';
    }
    this.writeHead(errorCode, {'Content-Type': 'text/html'});
    this.end(message);
}
function sendError404(errorInfo) {
    let message = Constants.get('config.http.message.404');
    if(errorInfo){
        message = message + errorInfo;
    }
    this.sendError(404,message);
}
function exists(absPath) {
    return new Promise(function (resolve,reject) {
        try{
            FS.exists(absPath,function (exist) {
                resolve(exist);
            });
        }catch(e){
            reject(e);
        }
    });

}
function stat(absPath) {
    return new Promise(function (resolve,reject) {
        FS.stat(absPath,function (err,stats) {
            if(err){
                reject(err);
            }else{
                resolve(stats);
            }
        });
    });
}
async function findResourceByPathname(_pathname) {
    const _ = this,
        config = _.getContextConfig();
    const resources = [];
    const isArray = _pathname instanceof Array;
    const pathnameArray = isArray ? _pathname : [_pathname];
    let index = 0;
    for(let pathname of pathnameArray){
        for(let doc of config.docBase){
            const contextPath = (doc.path || config.path || '/');
            let currentPathname = checkContextPath(pathname, contextPath);
            if(currentPathname === false){
                continue;
            }
            if (currentPathname.startsWith(doc.filters || Constants.get('config.context.filterDirName'))
                || currentPathname.startsWith(doc['controllers'] || Constants.get('config.context.controllerDirName'))) {
                continue;
            }

            let absPath = PATH.resolve(doc.dir, currentPathname);
            let cacheFileMime = await filePathCache.get(absPath);
            if (cacheFileMime || (await exists(absPath))) {

                let pathStat = await stat(absPath);
                if(!cacheFileMime && pathStat.isDirectory()){
                    absPath = appendDirIndexFile(absPath);
                    cacheFileMime = await filePathCache.get(absPath);
                    if(cacheFileMime || (await exists(absPath) && (pathStat = await stat(absPath)).isFile())){
                    }else{
                        continue;
                    }
                }
                if(!cacheFileMime){
                    if(!pathStat.isFile()){
                        continue;
                    }
                    filePathCache.set(absPath, getMime(absPath), 3000);
                }
                resources[index] = absPath;
                break;
            }
        }
        index++;
    }

    return isArray ? resources : resources[0];
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
function extend(request,response) {

    response.findResourceByPathname = findResourceByPathname;
    response.sendError = sendError;
    response.sendError404 = sendError404;
    response.getMime = getMime;

    const requestCache = {};
    request.getAttribute = getAttribute(requestCache);
    request.setAttribute = setAttribute(requestCache);
}
function init(chain,request,response) {
    const config = request.getContextConfig();
    if (!response.setHeader) {
        response.setHeader = function () {};
    }
    response.setHeader('Server', config.serverName);
    extend(request,response);
    chain.next();
}
init.priority = 999;
module.exports.execute = init;