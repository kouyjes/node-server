# node-server
node-server是一个用node实现的web服务器，支持基本的反向代理、node开发后端应用。

### node
### Get Starting
### 配置文件
node-server的配置文件位于conf目录下，是一个正常的node模块，config.demo.js为config的配置说明。

### 静态资源服务器配置
```javascript
exports.config = {
    contexts:[
        {
            path:'/', //配置
            docBase:[
                '/workspace' //配置静态资源目录绝对地址
                //{dir:'/workspace'} //以对象方式定义docBase
                //{dir:'/workspace',path:'/work'} 定义每个工作目录的path
            ],
            port:8080
            //port:[8080,8081]
        }
    ]
};
```

### 代理服务器配置
```javascript
exports.config = {
    contexts:[
        {
            ...
            proxy:{
                protocol:null,
                pathRule:'^/api',
                server:'192.168.1.100',
                port:80,
                headers:{}
            }
        }
    ]
};
```
proxy:配置代理，为一个对象或是数组，如配置为数组，则会根据顺序选择满足pathRule规则的代理。<br/>
protocol:定义代理的协议，默认与请求协议一致 <br/>
pathRule:配置代理的代理规则，为一个正则字符串,如：'^/api' <br/>
server:配置代理服务器IP <br/>
port:配置代理服务器端口，默认与请求端口一致 <br/>
headers:配置发送到代理服务器需要添加的header<br/>


### 会话配置
node-server会话默认是关闭的，当session配置有效时会启用会话，会话存储默认提供2中方式，文件会话存储于redis会话存储。

#### 文件会话存储
```javascript
exports.config = {
    contexts:[
        {
            ...
            session:{
                provider:{
                    type:'file',
                    dataFile:'/data/log/session.data'
                },
                timeout:30
            }
        }
    ]
};
```
provider:会话提供者<br/>
type:配置会话持久化类型<br/>
dataFile:配置会话存储的文件，实际情况会话文件后会附加相关的上下文信息<br/>
timeout:配置会话有效期，单位为分<br/>

#### redis会话存储
```javascript
exports.config = {
    contexts:[
        {
            ...
            session:{
                provider:{
                    type:'redis',
                    host:'127.0.0.1',
                    port:7050,
                    password:''
                },
                timeout:30
            }
        }
    ]
};
```
host:配置redis主机地址<br/>
port:配置redis端口<br/>
password:配置redis连接密码<br/>

#### 会话提供方式扩展
如果两种会话方式不满足实际需求，可对会话提供方式进行扩展，会话实现需要继承抽象类Session，会话提供者需要实现抽象类SessionProvider，然后在session/impl.json
中进行配置即可。


### server的协议支持
node-server协议类型支持http|h2|https

#### http
```javascript
exports.config = {
    contexts:[
        {
            ...
            protocol:'http'
        }
    ]
};
```
protocol:定义协议类型，默认是http协议

#### https
```javascript
exports.config = {
    contexts:[
        {
            ...
            protocol:'https',
            key:filePath.resolve('conf/private.pem'),
            cert:filePath.resolve('conf/file.crt')
        }
    ]
};
```
https协议需要配置私钥与证书路径

#### http2
```javascript
exports.config = {
    contexts:[
        {
            ...
            protocol:'h2',
            key:filePath.resolve('conf/private.pem'),
            cert:filePath.resolve('conf/file.crt')
        }
    ]
};
```

### 配置上下文属性
```javascript
exports.config = {
    contexts:[
        {
            ...
            attributes:{anonymous:false}
        }
    ]
};
```
attributes:定义上下文属性，可以通过config对象获取


####  node-server 完整配置说明
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

### node-server实现原理
对于每个context会启动一个node子进程，每个进程是相对独立的。<br/>
node-server包含很多filter与dispatcher，每个filter负责不同的职责以及对request的加工。<br/>
#### 内置filter
request-response-wrapper 实现常用的接口调用<br/>
request-session-wrapper 负责session部分<br/>
request-cookie-wrapper 负责cookie部分<br/>
request-response-304 负责缓存部分<br/>
cros-filter 负责一些跨域请求的处理<br/>
proxy-* 负责代理<br/>

#### 内置dispatcher
ControllerDispatcher 负责用户node程序接口的调用<br/>
StaticResourceDispatcher 静态资源转发<br/>

#### 用户filter定义
node-server默认会解析用户工作目录下filters目录，并解析目录中js文件的filter

```javascript
function loginFilter(chain,request,response){
    //todo
    chain.next();
}
loginFilter.priority = 1; //[optional]
exports.execute = loginFilter
```
filter文件是一个node模块，包含execute方法则被视为有效的filter，execute方法调用时会传入3个参数。<br/>
chain:filter链，每个filter执行后需调用chain.next()将请求移交给下一个filter，如不需要移交，则不需要调用。<br/>
request:代表请求对象<br/>
response：代表响应对象<br/>
priority:filter的优先级，默认为0，系统内置的filter调用优先于用户定义的filter<br/>



###  Controller定义
```javascript
function getUsers(request,response){
    var users = [];
    var result = JSON.stringify(users);
    response.outputContent(result,'application/json');
}
exports.users = getUsers;

//request url http://localhost/users

//you can also change default url mapping rule
function getBooks(request response){
    var pathParams = request.pathParams;
    var userId = pathParams.userId;
    var books = [];
    var result = JSON.stringify(books);
    response.outputContent(result,'application/json');
}
getBooks.$mappingUrl = '/users/{userId}'
exports.books = getBooks;
//request url http://localhost/users/123
```
server启动时会扫描用户工作目录下的controllers目录以及子目录js文件

每个controller也是一个node模块，exports中的每个方法对应controller的一个接口<br/>
function的$mappingUrl属性定义接口的url，没有此属性时，server会根据目录的层次生成默认的接口url<br/>
function的$methods定义接口调用允许的http METHOD,为数组或字符串<br/>



### Node Api启动server
```javascript
var server = require('nm-web-server');
var config = {
    contexts:[
        {
            ...
        }
    ]
};
server.startServer(config);
```

### API
Request<br/>
getContextConfig() 获取上下文配置<br/>
getAttribute(key) 返回属性<br/>
setAttribute(key,value)设置属性<br/>
getCookie(name) 获取Cookie<br/>
getSession() 获取session对象<br/><br/>

Session<br/>
setAttributes(property)设置属性<br/>
getAttribute(name,async)获取属性<br/>
invalid()<br/>
getId()<br/><br/>

Response<br/>
addCookie(cookie) 添加Cookie<br/>
outputContent(content,mime)输出内容<br/>
zipOutputContent(mime,content,encoding)压缩输出内容<br/>
sendError(errorCode,message) 输出错误响应<br/>
outputStaticResource(absPath)根据路径输出资源内容<br/>
zipOutputStaticResource(absPath,encoding)根据路径压缩输出资源内容<br/>



