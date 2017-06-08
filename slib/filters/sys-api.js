const heapdump = require('heapdump');
function startGC(chain,request,response){
    if(request.pathname === '/_system_/startGC'){
        heapdump.writeSnapshot('/var/local/' + Date.now() + '.heapsnapshot');
        response.end();
    }else{
        chain.next();
    }
}
exports.priority = 0;
exports.startGC = startGC;