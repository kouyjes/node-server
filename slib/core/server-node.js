'use strict';
const serverLogger = require('../logger/server-logger'),
    logger = serverLogger.getAppLogger();
const Request = require('./Request'),
    Response = require('./Response');
const serverProcess = require('./server-process');
const util = require('./../util/util');
const assert = require('assert'), clone = require('clone');
const cluster = require('cluster');
const cpuNum = require('os').cpus().length;
const http = require('http'),
    https = require('https');

const fs = require('fs');

const isMasterProcess = module.parent ? false : true;

const initFunctions = {
    http: initHttp,
    https: initHttps
};
function extractCommand() {
    const comParams = process.argv.slice(1);
    var paramConfig = {
        '--config': {value: null, encoding: 'base64'}
    }, config = paramConfig['--config']
    var currentConfig;
    comParams.forEach(function (comParam) {
        if (paramConfig[comParam]) {
            currentConfig = paramConfig[comParam];
            return;
        }
        if (!currentConfig) {
            return;
        }
        if (currentConfig.encoding) {
            comParam = JSON.parse(new Buffer(comParam, currentConfig.encoding).toString());
            currentConfig.value = comParam;
        } else {
            currentConfig.value = comParam;
        }
    });
    return config;
}
function init(config) {

    assert(!!config, 'config is invalid !');
    const port = config.port;
    if (typeof port !== 'number' || port <= 0) {
        throw new TypeError('server port value is invalid !');
    }

    const protocol = config.protocol;
    if (isMasterProcess && config.multiCpuSupport) {
        if (cluster.isMaster) {
            for (let i = 0; i < cpuNum; i++) {
                cluster.fork();
            }
            cluster.on('exit', function (oldWorker) {
                let message = 'worker-' + oldWorker.process.pid + ' died !';
                logger.error(message);

                let worker = cluster.fork();
                message = 'worker-' + worker.process.pid + ' started !';
                logger.warn(message);
            });
        } else {
            initFunctions[protocol].call(this, config);
        }
    } else {
        initFunctions[protocol].call(this, config);
    }


}
const requestMappingPath = './../mapping/request-mapping';
function initHttp(config) {

    config = util.freeze(config);
    const requestMapping = util.freeze(require(requestMappingPath)(config));
    const port = config.port;
    const server = http.createServer(function (req, resp) {
        let params = [req, resp, config, requestMapping];
        requestListener.apply(this, params);
    });
    server.listen(port);
}
function initHttps(config) {

    util.freeze(config);
    const port = config.port;
    const requestMapping = util.freeze(require(requestMappingPath)(config));
    if (!config.key || !config.cert) {
        throw new TypeError('cert and key field must be config when protocol is https !');
    }
    if (!fs.existsSync(config.key)) {
        throw new TypeError('key file is not exist ! ' + config.key);
    }
    if (!fs.existsSync(config.cert)) {
        throw new TypeError('cert file is not exist ! ' + config.cert);
    }
    const option = {
        key: fs.readFileSync(config.key),
        cert: fs.readFileSync(config.cert)
    };
    const server = https.createServer(option, function (req, resp) {
        let params = [req, resp, config, requestMapping];
        requestListener.apply(this, params);
    });
    server.listen(port);
}
if (isMasterProcess) {
    init(extractCommand().value);
    serverProcess.process();
} else {
    module.exports = {
        startServer: init
    };
}
class FilterChain {
    constructor(filters, filterArgs, finishCallback) {
        this.index = {count: 0};
        this.filters = filters ? filters : [];
        this.filterArgs = filterArgs ? filterArgs : [];
        this.finishCallback = finishCallback;
    }

    next() {
        var params = Array.prototype.slice.call(arguments);
        if(params.length > 0){
            params.forEach((param) => {
                if(param instanceof Request){
                    this.filterArgs[0] = param;
                }
                if(param instanceof Response){
                    this.filterArgs[1] = param;
                }
            });
        }
        if (this.index.count > this.filters.length - 1) {
            if (typeof this.finishCallback === 'function') {
                this.finishCallback.apply(null, this.filterArgs);
            }
            return;
        }
        var filter = this.filters[this.index.count++];
        var args = this.filterArgs;

        filter.apply(null, [this].concat(args));
    }
}
function requestListener(request, response, config, requestMapping) {

    logger.info('request', request.url);

    request = Request.create(request);
    response = Response.create(response);

    response.getContextConfig = request.getContextConfig = function () {
        return config;
    };
    request.getRequestMapping = function () {
        return requestMapping;
    };


    //execute filters interrupt if return false
    var internalFilters = requestMapping.getInternalFilters();
    var userFilters = requestMapping.getMatchedUserFilters(request.url);
    var dispatchers = requestMapping.getInternalDispatchers();
    var args = [request, response];

    var userFilterChain = new FilterChain(userFilters,args)
    var dispatchChain = new FilterChain(dispatchers,args);
    const internalFilterChain = new FilterChain(internalFilters, args);
    internalFilterChain.finishCallback = function () {
        userFilterChain.next();
    };
    userFilterChain.finishCallback = function () {
        dispatchChain.next();
    };
    try{
        internalFilterChain.next();
    }catch(e){
        if(response.sendError){
            response.sendError(500, 'server internal error!');
        }else{
            response.end();
        }
        logger.error(e);
    }


}


