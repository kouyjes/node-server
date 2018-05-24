const path = require('path');
const URL = require('url');
const fs = require('fs');
const zlib = require('zlib');
const Promise = require('promise');

function resolve(dir,name) {
    name = name.replace(/^\/+/,'');
    if(!dir.endsWith('/')){
        dir = dir + '/';
    }
    return dir + name;
}
function outputFileStream(stream,file) {
    return new Promise(function (resolve) {
        var readerStream = fs.createReadStream(file);
        readerStream.on('end',function () {
            resolve();
        });
        readerStream.on('error',function (e) {
            reject(e);
        });
        readerStream.pipe(stream,{
            end:false
        });
    });
}
async function outputStaticFiles(files) {
    const _ = this;
    var mime = this.getMime(files[0]);
    _.setHeader('Content-Type', mime);
    for(let file of files){
        await outputFileStream(_,file);
    }
    _.end();
}
async function zipFiles(files, encoding) {
    var _ = this;
    var mime = this.getMime(files[0]);
    _.setHeader('Content-Type', mime);
    var zipStream = _;
    if (encoding.match(/\bdeflate\b/)) {
        _.writeHead(200, {'Content-encoding': 'deflate'});
        zipStream = zlib.createDeflate();
    } else if (encoding.match(/\bgzip\b/)) {
        _.writeHead(200, {'Content-encoding': 'gzip'});
        zipStream = zlib.createGzip();
    }else{
        _.writeHead(200, {});
    }
    for(let file of files){
        await outputFileStream(zipStream,file);
    }
    if(zipStream !== _){
        zipStream.pipe(_);
    }
    zipStream.end();
}
const SPLIT = /\?{2,}/;
function execute(chain,request,response) {

    const config = request.getContextConfig();
    var url = request._url;
    var match;
    if(!config.combo || !(match = url.match(SPLIT))){
        return chain.next();
    }
    var acceptEncoding;
    if(config.zipResponse){
        acceptEncoding = request.headers['accept-encoding'];
    }

    var index = match.index;
    var dir = url.slice(0,index);
    var comboStr = url.slice(index + match[0].length);
    var pathnameArray = comboStr.split(',').map(function (resource) {
        var pathname = resolve(dir,resource);
        var urlInfo = URL.parse(pathname);
        pathname = path.normalize(urlInfo.pathname);
        pathname = pathname.replace(/\\/g,'/');
        return pathname;
    });
    response.findResourceByPathname(pathnameArray).then((resources) => {
        var _404Resources = [];
        pathnameArray.forEach(function (p,index) {
            var resource = resources[index];
            if(!resource){
                _404Resources.push(resource);
            }
        });
        if(_404Resources.length > 0){
            response.sendError404(_404Resources.join(','));
            return;
        }
        if(acceptEncoding){
            zipFiles.bind(response)(resources,acceptEncoding);
        }else{
            outputStaticFiles.bind(response)(resources);
        }
    });
}
execute.priority = -100;
exports.execute = execute;