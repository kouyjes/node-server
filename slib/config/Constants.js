'use strict';
const constant = {};
function get(name) {
    if (!name || typeof name !== 'string') {
        return undefined;
    }
    return constant[name];
}
function define(name, value) {
    if (!name || typeof name !== 'string') {
        return;
    }
    constant[name] = value;
    return define;
}
define('config.context.controllerDirName', 'controllers')
('config.context.filterDirName', 'filters')
('config.context.controller.mapping', '$mappingUrl')
('config.context.filter.path', '$contextPath')
('runtimeConfig', '../runtime/runtime.json');
exports.get = get;
