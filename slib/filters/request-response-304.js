'use strict';
const Promise = require('promise'),
    fs = require('fs');
function appendFileMeta(request,response,absPath){
    const key = 'If-Modified-Since';
    const lastMtime = request.headers[key] || request.headers[key.toLowerCase()];
    const promise = new Promise(function (resolve,reject) {
        fs.stat(absPath, function (err,stats) {
            let flag_304 = false;
            if(err){
                reject(flag_304);
                return;
            }
            if(stats && stats.mtime instanceof Date){
                flag_304 = lastMtime && lastMtime === stats.mtime.toUTCString();
                response.setHeader('Last-Modified',stats.mtime.toUTCString());
                response.setHeader('Cache-Control','public,max-age=3600');
            }
            resolve(flag_304);
        });
    });
    return promise;
}
function output_304(response){
    response.writeHead(304,{});
    response.end();
}
function process_304(chain,request,response){

    const config = request.getContextConfig();
    if(config.disabledAgentCache){
        response.setHeader('Cache-Control','no-cache');
        chain.next();
        return;
    }

    const outputFile = response.outputFile,
        zipOutputStaticResource = response.zipOutputStaticResource,
        outputStaticResource = response.outputStaticResource;

    response.zipOutputStaticResource = function (absPath,acceptEncoding) {
        const args = arguments;
        return appendFileMeta(request,response,absPath).then(function (flag_304) {
            if(flag_304){
                output_304(response);
                return;
            }
            zipOutputStaticResource.apply(response,args);
        });
    };

    response.outputStaticResource = function (absPath) {
        const args = arguments;
        return appendFileMeta(request,response,absPath).then(function (flag_304) {
            if(flag_304){
                output_304(response);
                return;
            }
            outputStaticResource.apply(response,args);
        });
    };
    response.outputFile = function(pathname,acceptEncoding){
        if(pathname !== request.pathname){
            outputFile.apply(response,arguments);
            return;
        }
        outputFile.apply(response,arguments);
    };

    chain.next();
}
process_304.priority = 80;
exports.execute = process_304;