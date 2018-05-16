const fs = require('fs');
const filePath = require('../file/file-path');
const pidPath = filePath.getPidPath();
const runtimeConfFile = filePath.getRuntimeConfPath();
exports.initDirs = function () {
    filePath.getSystemDirs().forEach(function (dir) {
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    });
};
exports.config = function (key,config) {
    var config;
    if(fs.existsSync(runtimeConfFile)){
        try{
            config = JSON.parse(fs.readFileSync(runtimeConfFile));
        }catch (e){}
    }
    if(!config){
        config = {};
    }
    if(arguments.length === 0){
        return config;
    }
    var configObj = {};
    if(arguments.length === 1){
        if(typeof key === 'object'){
            configObj = key;
        }else{
            return config[key];
        }
    }else if(arguments.length === 2){
        configObj[key] = config;
    }
    Object.keys(configObj).forEach(function (k) {
        config[k] = configObj[k];
    });
    fs.writeFileSync(runtimeConfFile,JSON.stringify(config,null,4));
};
exports.getContext = function (contextKey) {
    var contexts = this.config('contexts') || [];
    var context = null;
    contexts.some(function (ctx) {
        if(ctx.port == contextKey){
            context = ctx;
            return true;
        }
    });
    return context;
};

function pids(pidList) {
    if(arguments.length === 1){
        fs.writeFileSync(pidPath, pidList.join(' '));
        return;
    }
    var pidContent = '';
    if (fs.existsSync(pidPath)) {
        pidContent = new Buffer(fs.readFileSync(pidPath)).toString('utf-8');
    }
    return pidContent.split(/\s+/);
}
function _process(pid) {
    var pid = pid || process.pid;
    var _pids = pids();
    if(_pids.indexOf(pid) === -1){
        _pids.push(pid);
    }
    pids(_pids);

}
function startProcess(pid) {
    fs.writeFileSync(pidPath, '');
    _process(pid);
}
exports.removeProcess = function (pid) {
    var _pids = pids();
    var index = _pids.indexOf(pid);
    if(index >= 0){
        _pids.splice(index,1);
    }
    pids(_pids);
};
exports.process = _process;
exports.startProcess = startProcess;