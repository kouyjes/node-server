'use strict';
const ParamUrlMapping = require('./ParamUrlMapping');
const fs = require('fs'), path = require('path');
const Constants = require('./../config/Constants');
const filePath = require('../../file/file-path');
class RequestMapping {
    constructor(config) {

        this.mapping = {
            internal: {
                filters: [],
                dispatchers: []
            },
            userFilters: [],
            paramUrlMapping: new ParamUrlMapping()
        };
        this._initInternalFilters()
        this._initInternalDispatchers();
        this._initDocs(config);
        this._initUserFilters(config);
    }

    getInternalFilters() {
        return this.mapping.internal.filters;
    }

    getInternalDispatchers() {
        return this.mapping.internal.dispatchers;
    }

    getUserFilters() {
        return this.mapping.userFilters;
    }

    getMatchedRequestHandler(request) {
        const methodInfo = this.mapping.paramUrlMapping.matchMethod(request);
        return methodInfo;
    }

    _initInternalFilters() {
        this._initFilters([{dir: filePath.getInternalLibPath()}], this.mapping.internal.filters, true);
    }

    _initInternalDispatchers() {
        this._initFilters([{
            dir: filePath.getInternalLibPath(),
            filters: 'dispatchers'
        }], this.mapping.internal.dispatchers, true);
    }

    _initUserFilters(config) {
        this._initFilters(config.docBase, this.mapping.userFilters, false);
        this.mapping.userFilters.forEach(function (filter) {
            const key = Constants.get('config.context.filter.path');
            if(!filter[key]){
                filter[key] = config.path || '/';
            }
        });
    }

    _initFilters(dirs, filters, isInternal) {
        dirs.forEach(function (d) {
            const directory = path.resolve(d.dir, d.filters || Constants.get('config.context.filterDirName'));
            if (!fs.existsSync(directory)) {
                return;
            }
            function extractDirectory(dir) {
                const files = fs.readdirSync(dir);
                files.forEach(function (file) {
                    const absPath = path.resolve(dir, file);
                    if (fs.statSync(absPath).isDirectory()) {
                        extractDirectory(absPath);
                        return;
                    }
                    if (!file.endsWith('.js')) {
                        return;
                    }
                    const ctrl = require(absPath);
                    if (typeof ctrl.execute === 'function') {
                        const filter = function () {
                            return ctrl.execute.apply(this, arguments);
                        };
                        filter.priority = ctrl.execute.priority || 0;
                        filter.isInternal = isInternal;
                        if(!isInternal){
                            filter[Constants.get('config.context.filter.path')] = d.path;
                        }
                        filters.push(filter);
                    }
                });
            }

            extractDirectory(directory);
        });

        this._sortFilters(filters);
    }

    _sortFilters(filters) {
        filters.sort(function (f1, f2) {
            const v1 = f1.priority ? f1.priority : 0, v2 = f2.priority ? f2.priority : 0;
            if (v1 > v2) {
                return -1;
            } else if (v1 < v2) {
                return 1;
            }
            return 0;
        });
    }

    _initDocs(config) {
        const docs = config.docBase;
        const _ = this;
        docs.forEach(function (d) {
            const contextPath = d.path || config.path || '/';
            const directory = path.resolve(d.dir, d['controllers'] || Constants.get('config.context.controllerDirName'));
            if (!fs.existsSync(directory)) {
                return;
            }
            function extractDirectory(dir) {
                const files = fs.readdirSync(dir);
                files.forEach(function (file) {
                    const absPath = path.resolve(dir, file);
                    if (fs.statSync(absPath).isDirectory()) {
                        extractDirectory(absPath);
                        return;
                    }
                    if (!file.endsWith('.js')) {
                        return;
                    }
                    const ctrl = require(absPath),
                        ctrlPath = path.relative(directory, dir);

                    _.initController(contextPath, ctrlPath, ctrl);
                });
            }

            extractDirectory(directory);
        });
    }

    initController(contextPath, ctrlPath, ctrl) {
        const _ = this;
        Object.keys(ctrl).forEach(function (k) {
            if (!ctrl.hasOwnProperty(k) || typeof ctrl[k] !== 'function') {
                return;
            }
            let mapPath = ctrl[k][Constants.get('config.context.controller.mapping')];
            if (!mapPath) {
                mapPath = ctrlPath + '/' + k;
                mapPath = contextPath + '/' + mapPath;
            }else{
                mapPath = contextPath + '/' + mapPath;
            }
            mapPath = mapPath.replace(/(\/){2,}/g, '$1');
            mapPath = mapPath.replace(/\\/g, '/');
            _.addControllerMethod(mapPath, ctrl[k]);
        });
    }

    addControllerMethod(mapPath, method) {

        this.mapping.paramUrlMapping.parseMapPath(mapPath, method);

    }

    getMatchedUserFilters(url){
        url = url || '';
        return this.mapping.userFilters.filter(function (filter) {
            const key = Constants.get('config.context.filter.path');
            const filterContextPath = filter[key];
            if(!filterContextPath){
                return false;
            }
            return url.startsWith(filterContextPath);
        });
    }
}
module.exports = function (config) {
    return new RequestMapping(config);
};

