const fs = require('fs'), path = require('path');
const filePath = require('../../file/file-path');
const pidPath = filePath.getPidPath();
function _process() {
    var pidContent = '';
    if (fs.existsSync(pidPath)) {
        pidContent = new Buffer(fs.readFileSync(pidPath)).toString('utf-8');
    }
    fs.writeFileSync(pidPath, (pidContent ? pidContent + '\n' : '') + process.pid);

}
function startProcess() {
    fs.writeFileSync(pidPath, '');
    _process();
}
exports.process = _process;
exports.startProcess = startProcess;