const SESSION_PREFIX = 'nsessionid_';
const uuid = require('node-uuid');
const SessionProvider = require('../session/SessionProvider');
function sessionWrapper(chain,request,response){

    const config = request.getContextConfig();
    const sessionKey = SESSION_PREFIX + Number(config.port).toString(16);
    var sessionCookie = request.getCookie(sessionKey);
    var sessionProvider = SessionProvider.getProvider(config);

    var session;
    function createNewSession(sessionId){
        sessionCookie = request.createCookie(sessionKey,sessionId || uuid.v4());
        response.addCookie(sessionCookie);
        return sessionProvider.createSession(sessionCookie.value).then(function (newSession) {
            session = newSession;
        });
    }
    function continueTick(){
        session = Object.freeze(session);
        request.getSession = function () {
            return session;
        };
        session.update();
        chain.next();
    }
    if(null === sessionCookie){
        createNewSession().then(function () {
            continueTick();
        });
    }else{
        sessionProvider.getSession(sessionCookie.value,false).then(function (newSession) {
            if(!newSession){
                createNewSession(sessionCookie.value).then(function () {
                    continueTick();
                });
            }else{
                session = newSession;
                continueTick();
            }
        });
    }
}
sessionWrapper.priority = 10;
exports.execute = sessionWrapper;