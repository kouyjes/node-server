
/**
 *
 * @type {{logFilePath: string, multiProcess: boolean, contexts: *[]}}
 *
 * 服务器启动过程中会对context中配置进行解析，对每一个context的dir目录进行扫描，对controllers和filters字段设定的目录解析
 * 生成映射规则和过滤器,默认值为controllers和filters
 *
 * context中字段配置说明
 * dir 用户工作目录
 * controllers 用户控制器逻辑,可根据目录路径生成请求路径和控制规则关系
 * filters 用户过滤器，根据每个过滤器的priority字段决定调用次序
 * path  上下文路径，此路径会比context.path优先使用
 *
 *
 */
'use strict';
var filePath = require('../file/file-path');
const config = {
    debugMode:true,
    multiProcess:false, //是否对多个contexts启动多进程
    contexts:[
        {
            serverName:'web server', //服务器名称
            multiCpuSupport:true,//根据CPU数量,启动多个进程,配置为true时，需要配置为redis session
            zipResponse:false,//对输出进行压缩
            sessionCookieName:'x3_session',//【optional】
            sessionCookiePath:null,//【optional default /】
            //protocol:'https', // 【default http】
            //key:filePath.resolve('conf/private.pem'), //
            //cert:filePath.resolve('conf/file.crt'), //
            docBase:[  //服务器工作目录
                '/www'
            ],
            session:{
                provider:{
                    type:'file',//会话持久化机制
                    dataFile:'/data/log/session.data' //会话文件
                },
                /*
                 provider:{
                 type:'redis',
                 host:'127.0.0.1'
                 //port password
                 },
                 */
                timeout:30,//会话过期时间，单位为分，默认30分钟
            },
            path:'/',//上下文路径
            port:[8080], //服务器监听端口,可配置多个
            attributes:{anonymous:false}, //配置自定义属性
            proxy:{
                pathRule:'^/api',
                server:'192.168.100.123',
                port:7771,
                headers:[]
            }
        }
    ]
};
exports.config = config;
