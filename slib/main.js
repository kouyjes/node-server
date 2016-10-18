const path = require('path'),childProcess = require('child_process'),fs = require('fs');
const configParser = require('./config-parser'),serverConfig = configParser.getServerConfig();
const logger = require('./server-logger').getLogger();
const clone = require('clone');
const serverProcess = require('./server-process');
if(serverConfig.debugMode){
    logger.setLevel('DEBUG');
}else {
    logger.setLevel('ERROR');
}
const serverContexts = serverConfig.getContexts();
const nodePath = process.execPath;
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
        if(!serverConfig.multiProcess){
            serverNode.startServer(app.config);
            return;
        }

        const appFile = path.resolve(__dirname,'server-node.js');
        const params = [appFile];
        params.push('--config');
        params.push(new Buffer(JSON.stringify(app.config)).toString('base64'));

        const pro = childProcess.spawn(nodePath,params);
        pro.stdout.on('data', function (data) {
            logger.error(String.fromCharCode.apply(null, data));
        });
        pro.stderr.on('data', function (data) {
            logger.error(String.fromCharCode.apply(null, data));
        });
        pro.on('exit', function (data) {
            logger.info(data);
        })
    });
});
process.on('uncaughtException',function (err) {
    logger.error(err);
    process.exit(0);
});

serverProcess.startProcess();