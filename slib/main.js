'use strict'
const serverLogger = require('./server-logger'),
    logger = serverLogger.getLogger(),
    consoleLogger = serverLogger.getConsoleLogger();
process.on('uncaughtException',function (err) {
    logger.error(err);
    consoleLogger.error(err);
    process.exit(0);
});

const path = require('path'),childProcess = require('child_process'),fs = require('fs');
const clone = require('clone');
const serverProcess = require('./server-process');

const configParser = require('./config-parser');

const nodePath = process.execPath;


function startServer(config){

    const serverConfig = configParser.getServerConfig(config);
    const serverContexts = serverConfig.getContexts();

    consoleLogger.info('starting Server ...');

    serverContexts.forEach(function (ctx) {
        const apps = [];
        const ports = ctx.port;

        ports.forEach(function (port) {
            const ctxConfig = clone(ctx);
            ctxConfig.port = port;
            apps.push({
                config:ctxConfig
            });
        });
        const serverNode = require('./server-node');
        apps.forEach(function (app) {

            consoleLogger.info('starting init server with context...');
            consoleLogger.info('config:\n' + JSON.stringify(app,null,4));

            if(!serverConfig.multiProcess){
                serverNode.startServer(app.config);
                return;
            }

            const appFile = path.resolve(__dirname,'server-node.js');
            const params = [appFile];
            params.push('--config');
            params.push(Buffer.from(JSON.stringify(app.config)).toString('base64'));

            const pro = childProcess.spawn(nodePath,params);
            pro.stdout.on('data', function (data) {
                let message = data.toString();
                logger.info(message);
                consoleLogger.info(message);
            });
            pro.stderr.on('data', function (data) {
                let errorInfo = data.toString();
                logger.error(errorInfo);
                consoleLogger.error(errorInfo);
            });
            pro.on('exit', function (data) {
                let message = data.toString();
                logger.info(message);
                consoleLogger.info(message);
            })
        });
    });

    serverProcess.startProcess();

    consoleLogger.info('Server startup finished !');
}

if(module.parent){
    exports.startServer = startServer;
}else{
    startServer(require(path.resolve(path.dirname(__dirname),'conf/config.js')).config);
}



