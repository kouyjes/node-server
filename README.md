# node-server
node-server is a http server,a proxy server
### Get Starting
First add a config file in conf directory for node=server,the config demo is in the same directory

####  node-server 配置说明
```javascript
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
 
 var filePath = require('../file/file-path');
config = {
  debugMode:false,
  multiProcess:false, //是否对多个contexts启动多进程
  contexts:[
    {
      serverName:'x3 nodejs server', //服务器名称
      multiCpuSupport:false,//根据CPU数量,启动多个进程,配置为true时，需要配置为redis session
      zipResponse:true,//对输出进行压缩
	  protocol:null,//【optional default http】协议定义
	  sessionCookieName:null,//【optional】
	  sessionCookiePath:null,//【optional default /】
	  //protocol:'https', // 【default http】
      //key:filePath.resolve('conf/private.pem'), //
      //cert:filePath.resolve('conf/file.crt'), //
      //disabledAgentCache:true, //禁用客户端缓存
      docBase:[  //服务器工作目录
        {dir:'/'},//{dir:'目录名称',controllers:'controllers',filters:'filters',path:'/'}
		'/workdpace',
        {dir:'/',path:'/ctx'}
      ],
      //optional 不配置session时不会启用session
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
		protocol:null,//【optional default http】 协议定义 
		pathRule:null,//【required】配置需要代理url的匹配规则，为正则表达式字符串
        server:'192.168.1.100', //配置服务端IP
        port:80, //【optional】配置服务端端口，如不配置则与请求端口一致
        headers:{} //【optional】配置发送请求时需要添加的header
	  }
    }
  ]
};
```
### Develop with node-server
#### Define filter in filters directory of same path which config.js defines
```javascript
    function loginFilter(chain,request,response){
        //todo
        chain.next();
    }
    loginFilter.priority = 1; //[optional]
    exports.execute = loginFilter
```
#### Define controller in controllers directory
```javascript
    function getUsers(request,response){
        var users = [];
        var result = JSON.stringify(users);
        response.outputContent('application/json',result);
    }
    exports.users = getUsers;
    
    //request url http://localhost/users
    
    //you can also change default url mapping rule
    function getBooks(request response){
        var pathParams = request.pathParams;
        var userId = pathParams.userId;
        var books = [];
        var result = JSON.stringify(books);
        response.outputContent('application/json',result);
    }
    getBooks.$mappingUrl = '/users/{userId}'
    exports.books = getBooks;
    //request url http://localhost/users/123
```

