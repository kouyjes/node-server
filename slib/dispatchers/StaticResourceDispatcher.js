function execute(chain,request,response){

    const config = request.getContextConfig();
    let acceptEncoding;
    if(config.zipResponse){
        acceptEncoding = request.headers['accept-encoding'];
    }
    response.outputFile(request.pathname,acceptEncoding);
    chain.next();
}
execute.priority = -999;
module.exports.execute = execute;