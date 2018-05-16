'use strict'

const path = require('path'), childProcess = require('child_process');
const clone = require('clone');
const Runtime = require('./Runtime');
const filePath = require('../file/file-path');
const configParser = require('./config/config-parser');
const nodePath = process.execPath;

Runtime.initDirs();
Runtime.startProcess();

function startServer(config) {

    const serverConfig = configParser.getServerConfig(config);

    const serverLogger = require('./logger/server-logger'),
        logger = serverLogger.getAppLogger();

    const serverContexts = serverConfig.getContexts();

    var contexts = [];
    serverContexts.forEach(function (ctx) {
        const ports = ctx.port;
        ports.forEach(function (port) {
            const ctxConfig = clone(ctx);
            ctxConfig.port = port;
            contexts.push(ctxConfig);
        });
    });

    Runtime.config(Object.assign({},serverConfig,{contexts:contexts}));

    logger.welcome('starting Server ...');

    contexts.forEach(function (ctx) {
        const serverNode = require('./core/server-node');
        logger.welcome('starting init server with context...');
        let configString = 'config:\n' + JSON.stringify(ctx, null, 4);
        logger.welcome(configString);

        if (!serverConfig.multiProcess) {
            serverNode.startServer(ctx);
            return;
        }

        const appFile = path.resolve(__dirname, 'core/server-node.js');
        const params = [appFile];
        params.push('--config');
        params.push(ctx.port);

        const pro = childProcess.spawn(nodePath, params,{stdio: ['ipc']});
        Runtime.process(pro.pid);

        pro.stdout.on('data', function (data) {
            let message = data.toString();
            logger.info(message);
        });
        pro.stderr.on('data', function (data) {
            let errorInfo = data.toString();
            logger.error(errorInfo);
        });
        pro.on('exit', function (data) {
            let message = data.toString();
            logger.info(message);
        });
    });

    // exception handler
    process.on('uncaughtException', function (err) {
        logger.error(err);
        process.exit(0);
    });

    logger.welcome('Server startup finished !');
}

if (module.parent) {
    exports.startServer = startServer;
} else {
    startServer(require(filePath.getServerConfPath()).config);
}

