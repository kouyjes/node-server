const proxy = require('./proxy').proxy;
let creating = false;

function Request(){
    if(!creating){
        throw new Error('constructor is disabled !');
    }
}
Request.create = function (request) {
    creating = true;
    const _request = new Request();
    creating = false;
    return proxy(_request,request);
}
module.exports = Request;
