const path = require('path');
const log4js = require('log4js');
const Runtime = require('../Runtime');
const filePath = require('./../../file/file-path');
const serverConfig = Runtime.getConfig();
log4js.loadAppender('file');
log4js.configure(require(filePath.getLogConfPath()).config, { reloadSecs: 300 });
const logger = log4js.getLogger('server-sys');
const consoleLogger = getLogger('server-console');
function getLogger(category) {
    if(typeof category === 'string'){
        return log4js.getLogger(category);
    }
    return logger;
};

class Logger{
    welcome(){
        consoleLogger.info.apply(consoleLogger,arguments);
        logger.info.apply(logger,arguments);
    }
    info(){
        if(serverConfig.debugMode){
            consoleLogger.info.apply(consoleLogger,arguments);
            logger.info.apply(logger,arguments);
        }
    }
    error(message){
        consoleLogger.error.apply(consoleLogger,arguments);
        logger.error.apply(logger,arguments);
    }
    warn(message){
        consoleLogger.warn.apply(consoleLogger,arguments);
        if(serverConfig.debugMode){
            logger.warn.apply(logger,arguments);
        }
    }
}
exports.getAppLogger = function () {
    return new Logger();
};