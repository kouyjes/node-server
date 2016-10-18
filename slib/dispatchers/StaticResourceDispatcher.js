function execute(chain,request,response,config){
    var acceptEncoding;
    if(config.zipResponse){
        acceptEncoding = request.headers['accept-encoding'];
    }
    response.outputFile(request.pathname,config,acceptEncoding);
    chain.next();
}
execute.priority = -1;
module.exports.execute = execute;