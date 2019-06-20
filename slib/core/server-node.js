'use strict';
const domain = require('domain');
const serverLogger = require('../logger/server-logger'),
    logger = serverLogger.getAppLogger();
const Request = require('./Request'),
    Response = require('./Response');
const util = require('./../util/util');
const assert = require('assert'), clone = require('clone');
const cluster = require('cluster');
const cpuNum = require('os').cpus().length;
const http = require('http');
const https = require('https');
const Runtime = require('../Runtime');
const http2Getter = function () {
    return require('http2');
};
const fs = require('fs');

const isMasterProcess = module.parent ? false : true;

const initFunctions = {
    http: initHttp,
    https: initHttps,
    http2:initHttp2
};
function extractCommand() {
    const comParams = process.argv.slice(1);
    const paramConfig = {
        '--config': {value: null}
    }, config = paramConfig['--config'];
    let currentConfig;
    comParams.forEach(function (comParam) {
        if (paramConfig[comParam]) {
            currentConfig = paramConfig[comParam];
            return;
        }
        if (!currentConfig) {
            return;
        }
        currentConfig.value = Runtime.getContext(comParam);
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
    const processNum = config['processNum'] || cpuNum;
    if (isMasterProcess && config.multiCpuSupport) {
        if (cluster.isMaster) {
            for (let i = 0; i < processNum; i++) {
                cluster.fork();
            }
            cluster.on('exit', function (oldWorker) {
                let pid = oldWorker.process.pid;
                let message = 'worker-' + pid + ' died !';
                logger.error(message);

                let worker = cluster.fork();
                pid = worker.process.pid;
                message = 'worker-' + pid + ' started !';
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
function checkKeyCert(config) {
    if (!config.key || !config.cert) {
        throw new TypeError('cert and key field must be config when protocol is https !');
    }
    if (!fs.existsSync(config.key)) {
        throw new TypeError('key file is not exist ! ' + config.key);
    }
    if (!fs.existsSync(config.cert)) {
        throw new TypeError('cert file is not exist ! ' + config.cert);
    }
}
function initHttps(config) {

    util.freeze(config);
    const port = config.port;
    const requestMapping = util.freeze(require(requestMappingPath)(config));
    checkKeyCert(config);
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
function initHttp2(config){
    util.freeze(config);
    const port = config.port;
    const requestMapping = util.freeze(require(requestMappingPath)(config));
    checkKeyCert(config);
    const option = {
        key: fs.readFileSync(config.key),
        cert: fs.readFileSync(config.cert),
        allowHTTP1:true
    };
    const http2 = http2Getter();
    const server = http2['createSecureServer'](option, function (req, resp) {
        let params = [req, resp, config, requestMapping];
        requestListener.apply(this, params);
    });
    server.listen(port);
}
if (isMasterProcess) {
    init(extractCommand().value);
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
        const params = Array.prototype.slice.call(arguments);
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
        const filter = this.filters[this.index.count++];
        const args = this.filterArgs;

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
    const internalFilters = requestMapping.getInternalFilters();
    const userFilters = requestMapping.getMatchedUserFilters(request.url);
    const dispatchers = requestMapping.getInternalDispatchers();
    const args = [request, response];

    const userFilterChain = new FilterChain(userFilters, args);
    const dispatchChain = new FilterChain(dispatchers, args);
    const internalFilterChain = new FilterChain(internalFilters, args);


    const d = domain.create();
    d.on('error',function (e) {
        try{
            if(response.sendError){
                response.sendError(500, 'server internal error !' + e);
            }else{
                response.end();
            }
        }catch (e){
            logger.error(e);
        }
        logger.error(e);
    });
    d.run(function () {
        internalFilterChain.finishCallback = function () {
            userFilterChain.next();
        };
        userFilterChain.finishCallback = function () {
            dispatchChain.next();
        };
        internalFilterChain.next();
    });
}

process.on('uncaughtException', function (err) {
    logger.error(err);
});