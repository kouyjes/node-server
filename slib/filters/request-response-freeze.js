const util = require('../util');
const requestAttrs = [
        'getContextConfig','getAttribute','setAttribute','pathname','queryParam','getSession'
    ],
    responseAttrs = [
        'sendError','outputStaticResource','zipOutputStaticResource','zipOutputContent','outputFile'
    ];
function freeze(chain,request,response){

    requestAttrs.forEach(function (attr) {
        var value = request[attr];
        delete request[attr];
        Object.defineProperty(request,attr,{
            value:value
        })
    });

    responseAttrs.forEach(function (attr) {
        var value = response[attr];
        if(Object.isFrozen(value)){
            return;
        }
        delete response[attr];
        Object.defineProperty(response,attr,{
            value:value
        })
    });

    chain.next();
}
freeze.priority = -1;
exports.execute = freeze;