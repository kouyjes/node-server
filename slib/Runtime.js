
const fs = require('fs');
const Runtime = require('../file/file-path');
const runtimeConfFile = Runtime.getRuntimeConfPath();
exports.getConfig = function () {
    return require(runtimeConfFile);
};
exports.updateConfig = function (config) {
    var configString = JSON.stringify(config,null,4);
    fs.writeFileSync(runtimeConfFile,configString);
};