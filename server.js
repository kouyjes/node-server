var server = require('./index.js');
const path = require('path');
var proxy = {
    pathRule:'^/api',
    server:'172.24.8.74',
    port:7000,
    headers:[]
};
// disabled proxy
proxy = null;
var config = {
    contexts:[
        {
            serverName:'web server',
            multiCpuSupport:false,
            zipResponse:false,
            sessionCookieName:'x3_session',
            sessionCookiePath:null,
            disabledAgentCache:true,
            port:8080,
            proxy:proxy,
            docBase:[
                {
                    path:'/',
                    dir:'e:/opt/deepclue/webapp-taiwan/src'
                },
                {
                    path:'/node_modules',
                    dir:'e:/opt/deepclue/webapp-taiwan/node_modules'
                },
                {
                    path:'/api',
                    dir:'e:/opt/deepclue/webapp-taiwan/mock'
                }
            ]
        }
    ]
};
process.on('exitProcess', function () {
    process.exit();
})
server.startServer(config);