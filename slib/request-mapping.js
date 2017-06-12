'use strict';
const ParamUrlMapping = require('./ParamUrlMapping');
const logger = require('./server-logger').getLogger();
const fs = require('fs'),path = require('path');
const Constants = require('./Constants');
class RequestMapping{
    constructor(config){

        this.mapping = {
            internal:{
                filters:[],
                dispatchers:[]
            },
            userFilters:[],
            paramUrlMapping:new ParamUrlMapping()
        };
        this._initInternalFilters()
        this._initInternalDispatchers();
        this._initDocs(config);
        this._initUserFilters(config);
    }
    getInternalFilters(){
        return this.mapping.internal.filters;
    }
    getInternalDispatchers(){
        return this.mapping.internal.dispatchers;
    }
    getUserFilters(){
        return this.mapping.userFilters;
    }
    getMatchedRequestHandler(pathInfo){

        var methodInfo = this.mapping.paramUrlMapping.matchMethod(pathInfo);
        return methodInfo;
    }
    _initInternalFilters(){
        this._initFilters([{dir:__dirname}],this.mapping.internal.filters,true);
    }
    _initInternalDispatchers(){
        this._initFilters([{dir:__dirname,filters:'dispatchers'}],this.mapping.internal.dispatchers,true);
    }
    _initUserFilters(config){
        this._initFilters(config.docBase,this.mapping.userFilters,false);
    }
    _initFilters(dirs,filters,isInternal){
        dirs.forEach(function (d) {
            var directory = path.resolve(d.dir, d.filters || Constants.get('config.context.filterDirName'));
            if(!fs.existsSync(directory)){
                return;
            }
            function extractDirectory(dir){
                var files = fs.readdirSync(dir);
                files.forEach(function (file) {
                    const absPath = path.resolve(dir,file);
                    if(fs.statSync(absPath).isDirectory()){
                        extractDirectory(absPath);
                        return;
                    }
                    if(!file.endsWith('.js')){
                        return;
                    }
                    const ctrl = require(absPath);
                    if(typeof ctrl.execute === 'function'){
                        const filter = function () {
                            return ctrl.execute.apply(this,arguments);
                        };
                        filter.priority = ctrl.execute.priority || 0;
                        filter.isInternal = isInternal;
                        filters.push(filter);
                    }
                });
            }
            extractDirectory(directory);
        });

        this._sortFilters(filters);
    }
    _sortFilters(filters){
        filters.sort(function (f1,f2) {
            var v1 = f1.priority?f1.priority: 0,v2 = f2.priority?f2.priority:0;
            if(v1 > v2){
                return -1;
            }else if(v1 < v2){
                return 1;
            }
            return 0;
        });
    }
    _initDocs(config){
        const docs = config.docBase;
        var _ = this;
        docs.forEach(function (d) {
            const contextPath = d.path || config.path || '/';
            var directory = path.resolve(d.dir,d['controllers'] || Constants.get('config.context.controllerDirName'));
            if(!fs.existsSync(directory)){
                return;
            }
            function extractDirectory(dir){
                var files = fs.readdirSync(dir);
                files.forEach(function (file) {
                    const absPath = path.resolve(dir,file);
                    if(fs.statSync(absPath).isDirectory()){
                        extractDirectory(absPath);
                        return;
                    }
                    if(!file.endsWith('.js')){
                        return;
                    }
                    const ctrl = require(absPath),
                        ctrlPath = path.relative(directory,dir);

                    _.initController(contextPath,ctrlPath,ctrl);
                });
            }
            extractDirectory(directory);
        });
    }
    initController(contextPath,ctrlPath,ctrl){
        var _ = this;
        Object.keys(ctrl).forEach(function (k) {
            if(!ctrl.hasOwnProperty(k) || typeof ctrl[k] !== 'function'){
                return;
            }
            var mapPath = ctrl[k][Constants.get('config.context.controller.mapping')];
            if(!mapPath){
                mapPath = ctrlPath + '/' + k;
                mapPath = contextPath + '/' + mapPath;
                mapPath = mapPath.replace(/(\/){2,}/g,'$1');
                mapPath = mapPath.replace(/\\/g,'/');
            }
            _.addControllerMethod(mapPath,ctrl[k]);
        });
    }
    addControllerMethod(mapPath,method){

        this.mapping.paramUrlMapping.parseMapPath(mapPath,method);

    }
}
module.exports = function (docs) {
    return new RequestMapping(docs);
};

