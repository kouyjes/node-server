const path = require('path');
const dirName = path.dirname(__dirname);
function resolve(file) {
    return path.resolve(dirName,file);
};
exports.resolve = resolve;
exports.getPidPath = function () {
    return resolve('runtime/server.pid');
};
exports.getLogConfPath = function () {
    return resolve('./conf/logger.json');
};
exports.getServerConfPath = function () {
    return resolve('./conf/config.js');
};
exports.getRuntimeConfPath = function () {
    return resolve('./runtime/runtime.json');
};
exports.getInternalLibPath = function () {
    return resolve('slib');
};
