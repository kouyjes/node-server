function startGC(chain,request,response){
    if(request.pathname === '/_system_/startGC'){
        response.end('');
    }else{
        chain.next();
    }
}
exports.priority = 0;
exports.startGC = startGC;