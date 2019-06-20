const proxy = require('./proxy').proxy;
let creating = false;

function Response(){
    if(!creating){
        throw new Error('constructor is disabled !');
    }
}
Response.create = function (response) {
    creating = true;
    const _response = new Response();
    creating = false;
    return proxy(_response,response);
}
module.exports = Response;
