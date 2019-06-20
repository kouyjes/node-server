'use strict';
const logger = require('./../logger/server-logger').getAppLogger();
const pathCheckParamReg = /\{([^\/\}\{]+)\}/,
    pathParamReg = /\{([^\/\}\{]+)\}/g;
class PathRoute{
    constructor(name){
        this.name = name;
        this.routes = {};
        this.methods = [];
    }
    findRoute(name){
       return this.routes[name];
    }
    addRoute(route){
        this.routes[route.name] = route;
        return route;
    }
}
const METHOD_REG = '$urlRegExp';
const METHOD = '$methods';
class ParamUrlMapping{
    static isContainPathParam(mapPath){
        return pathParamReg.test(mapPath);
    }
    constructor(){
        this.pathRoute = new PathRoute();
        this.pathMapping = {};
    }
    _mapError(mapPath){
        const errorInfo = mapPath + ' mapping has exists!';
        logger.info(errorInfo);
        throw new EvalError(errorInfo);
    }
    parseMapPath(mapPath,method){
        if(ParamUrlMapping.isContainPathParam(mapPath)){
            let pathRoute = this.pathRoute;
            let paths = mapPath.split(/\//);

            paths.some(function (path) {
                if(!path){
                    return;
                }
                if(pathCheckParamReg.test(path)){
                    const paramNames = [];
                    let regPath = mapPath.replace(pathParamReg, function (match,paramName) {
                        paramNames.push(paramName);
                        return '([^/\\{}]+)';
                    });
                    regPath = '^' + regPath + '$';
                    method.pathVariables = paramNames;
                    let urlRegExp = method[METHOD_REG];
                    if(!Array.isArray(urlRegExp)){
                        urlRegExp = method[METHOD_REG] = [];
                    }
                    urlRegExp.push(new RegExp(regPath));
                    pathRoute.methods.push(method);
                    return true;
                }
                let pRoute = pathRoute.findRoute(path);
                if(!pRoute){
                    pathRoute = pathRoute.addRoute(new PathRoute(path));
                }else{
                    pathRoute = pRoute;
                }
            });
        }else{
            let mapping = this.pathMapping;
            if(mapping[mapPath]){
                this._mapError(mapPath);
            }
            mapping[mapPath] = method;
        }

        logger.info('mapping:' + mapPath);

    }
    isHttpMethodMatch(request,ctrlMethod){
        if(!ctrlMethod){
            return false;
        }
        let allowMethods = ctrlMethod[METHOD] || [];
        if(!Array.isArray(allowMethods)){
            allowMethods = [].concat(allowMethods);
        }
        if(allowMethods.length === 0){
            return true;
        }
        const _METHOD = request.method.toUpperCase();
        return allowMethods.some(function (m) {
            if(typeof m !== 'string'){
                return;
            }
            return m.toUpperCase() === _METHOD;
        });
    }
    matchMethod(request){

        const _this = this;
        const mapPath = request.pathname;
        let pathRoute = this.pathRoute;
        const paths = mapPath.split(/\//);
        let method = this.pathMapping[mapPath];
        const pathParams = {};

        if(this.isHttpMethodMatch(request,method)){
            Object.freeze(pathParams);
            return {
                method:method,
                pathParams:pathParams
            };
        }

        paths.some(function (path) {
            if(!path){
                return;
            }
            pathRoute.methods.some(function (m) {
                const urlRegExp = m[METHOD_REG] || [];
                let match = null;
                urlRegExp.some(function (regExp) {
                    match = mapPath.match(regExp);
                    return !!match;
                });
                if(!match){
                    return;
                }
                let vars = m.pathVariables || [];
                vars = [].concat(vars);
                match.shift();
                match.some(function (key) {
                    if(vars.length === 0){
                        return true;
                    }
                    let varName = vars.shift();
                    if(pathParams[varName]){
                        pathParams[varName] = [pathParams[varName],decodeURI(key)];
                    }else{
                        pathParams[varName] = decodeURI(key);
                    }
                });
                if(_this.isHttpMethodMatch(request,m)){
                    method = m;
                    return true;
                }
            });
            if(method){
                return true;
            }
            pathRoute = pathRoute.findRoute(path);
            if(!pathRoute){
                return true;
            }
        });
        if(!method){
            return null;
        }
        Object.freeze(pathParams);
        return {
            method:method,
            pathParams:pathParams
        };
    }
}
module.exports = ParamUrlMapping;