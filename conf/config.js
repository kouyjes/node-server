'use strict';
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
 */
const config = {
  debugMode:false,
  logFilePath:__dirname + '/logger.json', //日志文件路径
  multiProcess:false, //是否对多个contexts启动多进程
  contexts:[
    {
      serverName:'x3 nodejs server', //服务器名称
      zipResponse:false,//对输出进行压缩
      docBase:[  //服务器工作目录
		'/opt/x3/www',
        {dir:'/opt/x3_cube',path:'/x3_cube'},
			{dir:'/opt/test/kk',path:'/t'}
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
      port:[7771], //服务器监听端口,可配置多个
      attributes:{anonymous:false}, //配置自定义属性
      proxy:{
        pathRule:/^\/api/,
        server:'172.24.63.45',
        port:7771,
        headers:[]
      }
    },
    {
      serverName:'x3 nodejs server', //服务器名称
      zipResponse:false,//对输出进行压缩
      docBase:[  //服务器工作目录
        '/opt/x3/www',
        {dir:'/opt/x3_cube',path:'/x3_cube'}
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
      port:[7773], //服务器监听端口,可配置多个
      attributes:{anonymous:true} //配置自定义属性
    },
	{
      serverName:'x3admin nodejs server', //服务器名称
      zipResponse:true,//对输出进行压缩
      protocol:'https',
      key:'../conf/private.pem',
      cert:'../conf/file.crt',
      docBase:[  //服务器工作目录
        '/opt/x3admin/www'
      ],
      session:{
        provider:{
          type:'file',
          dataFile:'/data/log/session.data' //会话文件
        },
        timeout:30,//会话过期时间，单位为分，默认30分钟
      },
      path:'/',//上下文路径
      port:[7772], //服务器监听端口,可配置多个
      attributes:{admin:true,anonymous:false}, //配置自定义属性
      proxy:{
        pathRule:/^\/adminApi/,
        server:'172.24.63.42',
        port:7772,
        headers:[]
      }
    },
    {
      serverName:'portal server',
      protocol:'https',
      key:'../conf/private.pem',
      cert:'../conf/file.crt',
      docBase:['/opt/x3_cube/navigation'],
      path:'/',
      proxy:{
        pathRule:/^\/.+/,
        server:'172.24.63.42',
        headers:[]
      },
      port:[8080]
    },
    {
      serverName:'portal server',
      protocol:'https',
      key:'../conf/private.pem',
      cert:'../conf/file.crt',
      docBase:['/opt/test'],
      path:'/https',
      port:[8081]
    }
  ]
};
exports.config = config;
