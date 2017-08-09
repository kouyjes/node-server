const proxy = require('./proxy').proxy;
var creating = false;
function Response(){
    if(!creating){
        throw new Error('constructor is disabled !');
    }
}
Response.create = function (response) {
    creating = true;
    var _response = new Response();
    creating = false;
    return proxy(_response,response);
}
module.exports = Response;
