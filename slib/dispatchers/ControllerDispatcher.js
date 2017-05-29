const logger = require('../server-logger').getLogger();
function execute(chain,request,response,requestMapping){
    const handlerInfo = requestMapping.getMatchedRequestHandler(request.pathname);
    const handler = handlerInfo.method,
        pathParams = handlerInfo.pathParams;
    if(typeof handler === 'function'){
        try{
            Object.defineProperty(request,'pathParams',{
                value:pathParams
            });
            handler.call(handler,request,response);

        }catch (e){
            logger.error(e);
            response.sendError(500,'server internal error !' + JSON.stringify(e));
        }
        return;
    }
    chain.next();
}
execute.priority = 100;
module.exports.execute = execute;