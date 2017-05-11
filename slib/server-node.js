'use strict';
const logger = require('./server-logger').getLogger();
const serverProcess = require('./server-process');
const util = require('./util');
function extractCommand(){
    const comParams = process.argv.slice(1);
    var paramConfig = {
        '--config':{value:null,encoding:'base64'}
    },config = paramConfig['--config']
    var currentConfig;
    comParams.forEach(function (comParam) {
        if(paramConfig[comParam]){
            currentConfig = paramConfig[comParam];
            return;
        }
        if(!currentConfig){
            return;
        }
        if(currentConfig.encoding){
            comParam = JSON.parse(new Buffer(comParam,currentConfig.encoding).toString());
            currentConfig.value = comParam;
        }else{
            currentConfig.value = comParam;
        }
    });
    return config;
}
const assert = require('assert'),clone = require('clone');
const http = require('http');
function init(config){
    assert(!!config,'config is invalid !');
    const port = config.port;
    if(typeof port !== 'number' || port <= 0){
        throw new TypeError('server port value is invalid !');
    }

    const requestMapping = require('./request-mapping')(config);
    const server = http.createServer(function (req,resp) {
        util.freeze(config);
        requestListener.apply(this,[req,resp,config,requestMapping]);
    });
    server.listen(port);
}
if(module.parent){
    module.exports = {
        startServer:init
    };
}else{
    init(extractCommand().value);
    serverProcess.process();
}
class FilterChain{
    constructor(filters,filterArgs,finishCallback){
        this.index = {count:0};
        this.filters = filters?filters:[];
        this.filterArgs = filterArgs?filterArgs:[];
        this.finishCallback = finishCallback;
    }
    next(){
        if(this.index.count > this.filters.length - 1){
            if(typeof this.finishCallback === 'function'){
                this.finishCallback.apply(null,this.filterArgs);
            }
            return;
        }
        var filter = this.filters[this.index.count++];
        var isInternal = filter.isInternal;
        var args = isInternal?this.filterArgs:this.filterArgs.slice(0,this.filterArgs.length - 1);
        try{
            filter.apply(null,[this].concat(args));
        }catch(e){
            let response = this.filterArgs[1];
            response.sendError && response.sendError(500,'server internal error!');
            logger.error(e);
            throw e;
        }
    }
}
function requestListener(request,response,config,requestMapping){

    Object.freeze(config);
    logger.info('request:'+request.url);

    request.getContextConfig = function () {
        return config;
    };

    //execute filters interrupt if return false
    var filters = requestListener.filters;
    if(!filters){
        filters = requestMapping.getInternalFilters().concat(requestMapping.getUserFilters());
        filters = requestListener.filters = filters.concat(requestMapping.getInternalDispatchers());
    }
    const args= [request,response,requestMapping];
    const filterChain = new FilterChain(filters,args)
    filterChain.next();

}


