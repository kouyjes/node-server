function configCROS(chain, request, response) {
    request.headers['origin'] && response.setHeader('Access-Control-Allow-Origin', request.headers['origin']);
    const headers = [
        {
            name: 'access-control-allow-method',
            request: 'access-control-request-method',
            value: 'GET,POST,PUT,UPDATE'
        },
        {
            name: 'access-control-allow-headers',
            request: 'access-control-request-headers',
            value: 'Content-Type,Set-Cookie'
        },
        {
            name: 'access-control-allow-credentials',
            value: true
        }
    ];
    headers.forEach(function (header) {
        const _header = request.headers[header.request];
        if (_header) {
            response.setHeader(header.name, _header);
        }
    });
    if (request.method === 'OPTIONS') {
        response.end();
        return;
    }
    chain.next();
}
configCROS.priority = 101;
exports.execute = configCROS;