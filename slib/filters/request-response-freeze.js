const util = require('../util');
const requestAttributes = [
        'getContextConfig','getAttribute','setAttribute','pathname','queryParam','getSession'
    ],
    responseAttributes = [
        'sendError','outputStaticResource','zipOutputStaticResource','zipOutputContent','outputFile'
    ];
function freeze(chain,request,response){

    requestAttributes.forEach(function (attr) {
        var value = request[attr];
        delete request[attr];
        Object.defineProperty(request,attr,{
            value:value
        })
    });

    responseAttributes.forEach(function (attr) {
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