const path = require('path');
const serverConfig = require(path.dirname(__dirname) + '/conf/config.js').config;
const log4js = require('log4js');
log4js.loadAppender('file');
log4js.configure(serverConfig.logFilePath, { reloadSecs: 300 });
exports.getLogger = function () {
    return log4js.getLogger('server-sys');
};