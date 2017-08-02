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
class ParamUrlMapping{
    static isContainPathParam(mapPath){
        return pathParamReg.test(mapPath);
    }
    constructor(){
        this.pathRoute = new PathRoute();
        this.pathMapping = {};
    }
    _mappError(mapPath){
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
                    var paramNames = [];
                    let regPath = mapPath.replace(pathParamReg, function (match,paramName) {
                        paramNames.push(paramName);
                        return '([^/\\{}]+)';
                    });
                    regPath = '^' + regPath + '$';
                    method.pathVariables = paramNames;
                    method.urlRegExp = new RegExp(regPath);
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
                this._mappError(mapPath);
            }
            mapping[mapPath] = method;
        }

        logger.info('mapping:' + mapPath);

    }
    matchMethod(mapPath){
        var pathRoute = this.pathRoute;
        var paths = mapPath.split(/\//);
        var method = null,pathParams = {};
        paths.some(function (path) {
            if(!path){
                return;
            }
            pathRoute.methods.some(function (m) {
                var match = mapPath.match(m.urlRegExp);
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
                method = m;
                return true;
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
            method = this.pathMapping[mapPath];
        }
        if(!method){
            return;
        }
        Object.freeze(pathParams);
        return {
            method:method,
            pathParams:pathParams
        };
    }
}
module.exports = ParamUrlMapping;