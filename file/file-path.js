const path = require('path');
const dirName = path.dirname(__dirname);
function resolve(dir, file) {
    if (file === void 0) {
        return path.resolve(dirName, dir);
    }
    return path.resolve(dir, file);
};
exports.resolve = resolve;
exports.getPidPath = function () {
    return resolve('runtime/server.pid');
};
exports.getRuntimePath = function () {
    return resolve('runtime');
};
exports.getLogConfPath = function () {
    return resolve('./conf/logger.js');
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
