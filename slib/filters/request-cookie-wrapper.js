const Cookie = require('../cookie/Cookie');
const assert = require('assert');
function requestCookieWrapper(chain,request,response){
    var cookieString = request.headers.cookie;
    if(!cookieString){
        cookieString = '';
    }
    var cookieStrings = cookieString.split(';');
    const requestCookies = {};
    cookieStrings.forEach(function (cookieStr) {
        const cookie = Cookie.parse(cookieStr);
        requestCookies[cookie.name] = cookie;
    });
    request.getCookie = function (name) {
        return requestCookies[name]?requestCookies[name]:null;
    };

    const responseCookies = {};
    function flushResponseCookie(response){
        const cookies = [];
        for(var attr in responseCookies){
            if(responseCookies.hasOwnProperty(attr)){
                cookies.push(responseCookies[attr].toString());
            }
        }
        response.setHeader('Set-Cookie',cookies);
    }
    request.createCookie = response.createCookie = function (name,value) {
        return new Cookie(name,value);
    };
    response.addCookie = function (cookie) {
        assert((cookie instanceof Cookie),'cookie is invalid !');
        responseCookies[cookie.name] = cookie;
        flushResponseCookie(response);
    };
    response.removeCookie = function (name) {
        delete responseCookies[name];
        flushResponseCookie(response);
    };

    chain.next();
}
requestCookieWrapper.priority = 50;
exports.execute = requestCookieWrapper;