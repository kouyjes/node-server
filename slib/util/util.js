const util = {},
    baseTypes = ['array', 'string', 'number', 'undefined'];
function isBaseType(value) {
    if (value === null) {
        return true;
    }
    return baseTypes.indexOf(typeof value) >= 0;
}

util.freeze = function (object) {
    return Object.freeze(object);
};
module.exports = util;