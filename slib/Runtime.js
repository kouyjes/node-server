const fs = require('fs');
const filePath = require('../file/file-path');
const runtimeConfFile = filePath.getRuntimeConfPath();
exports.getConfig = function () {
    if (fs.existsSync(runtimeConfFile)) {
        return require(runtimeConfFile);
    }
    return new Object();
};
exports.updateConfig = function (config) {
    var configString = JSON.stringify(config, null, 4);
    fs.writeFileSync(runtimeConfFile, configString);
};