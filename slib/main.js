'use strict'

const path = require('path'), childProcess = require('child_process'), fs = require('fs');
const clone = require('clone');

const filePath = require('../file/file-path');
const configParser = require('./config/config-parser');
const Runtime = require('./Runtime');
const serverProcess = require('./core/server-process');
const nodePath = process.execPath;

function startServer(config) {

    const serverConfig = configParser.getServerConfig(config);
    Runtime.updateConfig(serverConfig);

    const serverLogger = require('./logger/server-logger'),
        logger = serverLogger.getAppLogger();

    const serverContexts = serverConfig.getContexts();

    logger.welcome('starting Server ...');

    serverContexts.forEach(function (ctx) {
        const apps = [];
        const ports = ctx.port;

        ports.forEach(function (port) {
            const ctxConfig = clone(ctx);
            ctxConfig.port = port;
            apps.push({
                config: ctxConfig
            });
        });
        const serverNode = require('./core/server-node');
        apps.forEach(function (app) {

            logger.welcome('starting init server with context...');
            let configString = 'config:\n' + JSON.stringify(app, null, 4);
            logger.welcome(configString);

            if (!serverConfig.multiProcess) {
                serverNode.startServer(app.config);
                return;
            }

            const appFile = path.resolve(__dirname, 'server-node.js');
            const params = [appFile];
            params.push('--config');
            params.push(Buffer.from(JSON.stringify(app.config)).toString('base64'));

            const pro = childProcess.spawn(nodePath, params);
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
            })
        });
    });

    serverProcess.startProcess();

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



