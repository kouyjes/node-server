const logger = require('../logger/server-logger').getAppLogger();
function execute(chain, request, response) {
    const requestMapping = request.getRequestMapping();
    const handlerInfo = requestMapping.getMatchedRequestHandler(request.pathname);
    if (handlerInfo) {
        try {
            Object.defineProperty(request, 'pathParams', {
                value: handlerInfo.pathParams
            });
            handlerInfo.method.call(handlerInfo.method, request, response);

        } catch (e) {
            logger.error(e);
            response.sendError(500, 'server internal error !' + JSON.stringify(e));
        }
        return;
    }
    chain.next();
}
execute.priority = 100;
module.exports.execute = execute;