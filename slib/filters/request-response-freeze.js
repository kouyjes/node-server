const util = require('../util/util');
const requestAttributes = [
        'getContextConfig','getRequestMapping', 'getAttribute', 'setAttribute', 'pathname', 'queryParam', 'getSession'
    ],
    responseAttributes = [
        'sendError', 'outputStaticResource', 'zipOutputStaticResource', 'zipOutputContent', 'outputFile','outputContent'
    ];
function freeze(chain, request, response) {

    requestAttributes.forEach(function (attr) {
        var value = request[attr];
        Object.defineProperty(request, attr, {
            value: value
        })
    });

    responseAttributes.forEach(function (attr) {
        var value = response[attr];
        Object.defineProperty(response, attr, {
            value: value
        })
    });

    chain.next();
}
freeze.priority = -100;
exports.execute = freeze;