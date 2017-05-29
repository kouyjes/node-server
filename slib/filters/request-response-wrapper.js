const FS = require('fs'),PATH = require('path'),MIME = require('mime'),URL = require('url');
const zlib = require('zlib');
const XCache = require('../cache');
const filePathCache = new XCache();
const Promise = require('promise');
const Constants = require('../Constants');
function checkContextPath(pathname,contextPath){
    if(!pathname.startsWith(contextPath)){
        return null;
    }
    pathname = pathname.substring(contextPath.length);
    if(!pathname){
        pathname = 'index.html';
    }
    pathname = pathname.replace(/^\/+/,'');
    return pathname;
}

function readFile(absPath){
    const promise = new Promise(function (resolve,reject) {
        FS.readFile(absPath, function (err, data) {
           if(err){
               reject(err);
           }else{
               resolve(data);
           }
        });
    });
    return promise;
}
function sendError(errorCode,message) {
    if(!errorCode){
        errorCode = 404;
    }
    if(!message){
        message = '';
    }
    this.writeHead(errorCode, { 'Content-Type': 'text/html' });
    this.end(message);
}
function outputStaticResource(absPath) {
    const _ = this;
    return readFile(absPath).then(function (data) {
        var mime = getMime(absPath);
        _.outputContent(mime,data);
        return data;
    }, function () {
        _.sendError(404,'404 error not found resource ');
    });
}
function zipOutputStaticResource(absPath,encoding) {
    var _ = this;
    var readerStream = FS.createReadStream(absPath);
    var mime = getMime(absPath);
    _.setHeader('Content-Type',mime);
    if(encoding.match(/\bdeflate\b/)){
        _.writeHead(200, { 'Content-encoding': 'deflate' });
        readerStream.pipe(zlib.createDeflate()).pipe(_);
    }else if (encoding.match(/\bgzip\b/)) {
        _.writeHead(200, { 'Content-encoding': 'gzip' });
        readerStream.pipe(zlib.createGzip()).pipe(_);
    }else{
        _.writeHead(200, {});
        readerStream.pipe(_);
    }
}
function zipOutputContent(mime,content,encoding) {

    const headers = {
        'Content-Type': mime
    };
    const _ = this;
    var output = content;
    _.setHeader('Content-Type',mime);
    if(encoding.match(/\bdeflate\b/)){
        output = zlib.deflateSync(content);
        headers['Content-encoding'] = 'deflate';
    }else if(encoding.match(/\bgzip\b/)){
        output = zlib.gzip(content);
        headers['Content-encoding'] = 'gzip';
    }
    _.writeHead(200, headers);
    _.end(output);
}
function outputContent(mime,content) {
    this.writeHead(200, { 'Content-Type': mime });
    this.end(content);
}
function outputFile(pathname,acceptEncoding){
    const _ = this,
        config = _.getContextConfig();
    var result = config.docBase.some(function (doc) {
        const contextPath  = (doc.path || config.path || '/');
        var currentPathname = checkContextPath(pathname,contextPath);
        if(!currentPathname){
            return;
        }
        if(currentPathname.startsWith(doc.filters || Constants.get('config.context.filterDirName'))
            || currentPathname.startsWith(doc.controllers || Constants.get('config.context.controllerDirName'))){
            return;
        }

        const absPath = PATH.resolve(doc.dir,currentPathname);
        var cacheFileMime = filePathCache.syncGet(absPath);
        if(cacheFileMime || (FS.existsSync(absPath) && !FS.statSync(absPath).isDirectory())){
            !cacheFileMime && filePathCache.set(absPath,getMime(absPath),3000);
            if(acceptEncoding){
                _.zipOutputStaticResource(absPath,acceptEncoding);
            }else{
                _.outputStaticResource(absPath);
            }
            return true;
        }
    });
    if(!result){
        _.sendError(404,'404 error not found resource ');
    }
}
function getAttribute(name) {
    return this.requestCache[name];
}
function setAttribute(name,value) {
    this.requestCache[name] = value;
    return this;
}
function extendRequestResponse(request,response){

    const config = request.getContextConfig();
    response.sendError = sendError;
    response.outputStaticResource = outputStaticResource;
    response.zipOutputStaticResource = zipOutputStaticResource;
    response.zipOutputContent = zipOutputContent;
    response.outputContent = outputContent;
    response.outputFile = outputFile;
    request.requestCache = {};
    request.getAttribute = getAttribute;
    request.setAttribute = setAttribute;
}
function getMime(absPath){
    var mime = MIME.lookup(PATH.basename(absPath));
    if(!mime){
        mime = 'text/html;charset=utf-8';
    }
    return mime;
}
function wrapperRequestResponse(chain,request,response){

    const config = request.getContextConfig();
    if(!response.setHeader){
        response.setHeader = function () {};
    }
    response.setHeader('Server',config.serverName);
    const urlInfo = URL.parse(request.url);
    request.pathname = urlInfo.pathname;
    var queryParam = request.queryParam = {};
    var query = urlInfo.query;
    query && query.split('&').forEach(function (querySection) {
        var param = querySection.split('=');
        if(param.length < 2){
            return;
        }
        var paramObj = queryParam[param[0]];
        if(paramObj){
            queryParam[param[0]] = [paramObj].concat(param[1]);
        }else{
            queryParam[param[0]] = param[1];
        }
    });

    extendRequestResponse(request,response);

    chain.next();
}
wrapperRequestResponse.priority = 100;
module.exports.execute = wrapperRequestResponse;