const path = require('path');
const serverConfig = require(path.dirname(__dirname) + '/conf/config.js').config;
const log4js = require('log4js');
log4js.loadAppender('file');
log4js.configure(serverConfig.logFilePath, { reloadSecs: 300 });
var logger = log4js.getLogger('server-sys');
exports.getLogger = function (category) {
    if(typeof category === 'string'){
        return log4js.getLogger(category);
    }
    return logger;
};