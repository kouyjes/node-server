'use strict';
const cookiePropNames = ['path','expires','domain','secure','max-age'];
function Cookie(name,value){
    if(typeof name !== 'string' && name.trim()){
        throw new TypeError('invalid parameter !');
    }
    this.name = name.trim();
    this.value = typeof value === 'string'?value.trim():value + '';
    this.properties = {path:'/'};
}
Cookie.parse = function (cookieText) {
    if(typeof cookieText !== 'string') {
        throw new TypeError('invalid parameter !' + cookieText);
    }
    var seps = cookieText.split(';');
    var name,value,properties = {};
    seps.forEach(function (sep) {
        var pair = sep.split('=');
        switch (pair[0].toLowerCase().trim()){
            case 'path':
                properties['path'] = pair[1]?pair[1].trim():'';
                break;
            case 'secure':
                properties['secure'] = pair[1]?pair[1].trim():'';
                break;
            case 'domain':
                properties['domain'] = pair[1]?pair[1].trim():'';
                break;
            case 'expires':
                properties['expires'] = pair[1]?pair[1].trim():'';
                break;
            default:
                name = pair[0].trim();
                value = pair[1]?pair[1].trim():'';
        }
    });
    var cookie = new Cookie(name,value);
    cookie.properties = properties;
    return cookie;
};
Cookie.prototype.setDomain = function (domain) {
    this.properties.domain = domain;
};
Cookie.prototype.setPath = function (path) {
    this.properties.path = path;
};
/**
 * @param maxAge min
 */
Cookie.prototype.setMaxAge = function (maxAge) {
    this.properties['max-age'] = maxAge;
};
Cookie.prototype.setExpires = function (expires) {
    this.properties.expires = expires;
};
Cookie.prototype.equals = function (cookie) {
    if(!cookie){
        return false;
    }
    return this.name === cookie.name;
};
Cookie.prototype.setSecure = function (secure) {
    this.properties.secure = secure?'HttpOnly':'';
};
Cookie.prototype.toString = function () {
    var properties = this.properties;
    var cookieDesc = [];
    cookieDesc.push(this.name + '=' + this.value);
    for(let p in properties){
        if(!properties.hasOwnProperty(p) || !properties[p]){
            continue;
        }
        if(cookiePropNames.indexOf(p) >= 0){
            cookieDesc.push(p + '=' + properties[p]);
        }
    }
    return cookieDesc.join(' ; ');
};
module.exports = Cookie;