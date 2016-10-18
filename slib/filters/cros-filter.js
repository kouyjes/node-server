function configCROS(chain,request,response){
    request.headers['origin'] && response.setHeader('Access-Control-Allow-Origin', request.headers['origin']);
    response.setHeader('Access-Control-Request-Method','GET,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers','Content-Type,Set-Cookie');
    response.setHeader('Access-Control-Allow-Credentials',true);
    if(request.method === 'OPTIONS'){
        response.end();
        return;
    }
    chain.next();
}
configCROS.priority = 11;
exports.execute = configCROS;