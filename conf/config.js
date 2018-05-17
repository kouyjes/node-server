const path = require('path');
var filePath = require('../file/file-path');
var key = filePath.resolve('conf/private.pem');
var cert = filePath.resolve('conf/file.crt');
const config = {
    debugMode:false,
    multiProcess:true,
    contexts:[
        {
            serverName:'web app server',
            multiCpuSupport:true,
            zipResponse:true,
            sessionCookieName:'x3_session',
            sessionCookiePath:null,
            disabledAgentCache:false,
            port:8888,
            protocol:'https',
            key:key,
            cert:cert,
            docBase:[
                {
                    path:'/',
                    dir:path.resolve(__dirname,'../webapps')
                }
            ]
        }
    ]
};
exports.config = config;