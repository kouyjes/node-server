const logger = require('../server-logger').getLogger();
function execute(chain,request,response,requestMapping){
    const handler = requestMapping.getMatchedRequestHandler(request.pathname);
    if(typeof handler === 'function'){
        try{
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