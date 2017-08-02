'use strict';
const fs = require('fs'),path = require('path');
const filePath = require('../../file/file-path');
const defaultFileSession = filePath.resolve(filePath.getRuntimePath(),'session.data');
function ServerContext(context){
    var properties = [
        {name:'serverName',value:'x3 server'},
        {name:'debugMode',value:false},
        {name:'protocol',value:'http'},
        {name:'key',value:null},
        {name:'cert',value:null},
        {name:'zipResponse',value:false},
        {name:'disabledAgentCache',value:false},
        {name:'docBase',value:[]},
        {name:'sessionCookieName',value:null},
        {name:'sessionCookiePath',value:'/'},
        {name:'path',value:null},
        {name:'anonymous',value:false },
        {name:'port',value:[7771]},
        {name:'session',value:false},
        {name:'attributes',value:{}},
        {name:'proxy',value:null},
        {name:'multiCpuSupport',value:false}
    ];
    properties.forEach(function (property) {
        var setInvoke = this['set' + property.name.substring(0,1).toUpperCase() + property.name.substring(1)];
        if(context && context[property.name]){
            if(typeof setInvoke === 'function'){
                setInvoke.call(this,context[property.name]);
            }else{
                this[property.name] = context[property.name];
            }
        }else{
            this[property.name] = property.value;
        }
    }.bind(this));

}
class CustomError extends TypeError{
    constructor (message){
        super(message);
    }
};
ServerContext.prototype.setSession = function (session) {
    this.session = session;
    if(!this.session || typeof session !== 'object'){
        this.session = false;
        return;
    }
    const provider = {
        type:'file',
        dataFile:defaultFileSession
    };
    if(typeof session.timeout !== 'number'){
        session.timeout = 60;
    }
    if(session.provider){
        Object.assign(provider,session.provider);
    }
    session.provider = provider;
};
ServerContext.prototype.setDocBase = function (docBase) {
    if(!docBase){
        return;
    }
    var errorInfo;
    if(typeof docBase === 'string'){
        docBase = [{dir:docBase}];
    }else if(docBase.dir){
        docBase = [docBase];
    }
    if(!(docBase instanceof Array)){
        errorInfo = 'parameter type is invalid !' + JSON.stringify(docBase);
        throw new CustomError(errorInfo)
    }
    docBase = docBase.map(function (v) {
        if(!v.dir){
            if(typeof v === 'string'){
                return {dir:v};
            }else{
                errorInfo = 'parameter type is invalid !' + JSON.stringify(v);
                throw new CustomError(errorInfo);
            }
        }else if(typeof v.dir !== 'string'){
            errorInfo = 'dir is invalid,string type needed !' + JSON.stringify(v);
            throw new CustomError(errorInfo);
        }
        return v;
    });
    this.docBase = docBase;
};
ServerContext.prototype.setPort = function (port) {
    if(!port){
        return;
    }
    var errorInfo;
    if(typeof port === 'number'){
        port = [port];
    }
    if(!(port instanceof Array)){
        errorInfo = 'parameter type is invalid ,number value needed !' + JSON.stringify(port);
        throw new CustomError(errorInfo);
    }
    const result = port.every(function (v) {
        return typeof v === 'number';
    });
    if(!result){
        errorInfo = 'parameter type is invalid ,number value needed !';
        throw new CustomError(errorInfo);
    }
    this.port = port;
};
ServerConfig.prototype.setProxy = function (proxy) {
    if(!proxy){
        return;
    }
    if(!proxy.protocol){
        proxy.protocol = 'http';
    }
    this.proxy = proxy;
};
function ServerConfig(config){
    this.contexts = null;
    this.logFilePath = null;
    this.multiProcess = false;
    this.debugMode = false;
    this.init(config);
}
ServerConfig.prototype.init = function (config) {
    const ctxs = config.contexts;
    const contexts = this.contexts = [];
    if(ctxs instanceof Array){
        ctxs.forEach((ctx,index) => {
            ctx.index = index;
            ctx.debugMode = this.debugMode;
            contexts.push(new ServerContext(ctx));
        });
    }
    this.logFilePath = config.logFilePath;
    this.multiProcess = config.multiProcess;
    this.debugMode = !!config.debugMode;
};
ServerConfig.prototype.getContexts = function () {
    if(this.contexts){
        return this.contexts;
    }else{
        return [];
    }
};
ServerConfig.prototype.setContexts = function (contexts) {
    if(!(context instanceof Array)){
        throw new CustomError('parameter value is invalid !');
    }
    const serverCtxs = [];
    contexts.forEach(function (context) {
        if(!(context instanceof ServerContext)){
            throw new CustomError('contexts item  must be instanceof ServerContext');
        }
        serverCtxs.push(context);
    });
    this.contexts = contexts;
};
function getServerConfig(config){
    return new ServerConfig(config);
}
exports.getServerConfig = getServerConfig;

