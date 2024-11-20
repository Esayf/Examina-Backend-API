function createTokenAndMessage(req, walletAddress) {
    const token = Math.random().toString(36).substring(7);
    req.session.token = token;
    const message = `${token}${walletAddress}`;
    req.session.message = process.env.NODE_ENV == "test" ? { message } : message;
    req.session.save();
    return message;
}
function getSessionUser(req) {
    console.log(req.session.message);
    return req.session.message || null;
}
async function setSessionUser(req, sessionUser) {
    req.session.user = sessionUser;
    return new Promise((resolve, reject) => {
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                reject(err);
            }
            resolve();
        });
    });
}
function destroySession(req, callback) {
    req.session.destroy(callback);
}
export default {
    getSessionUser,
    createTokenAndMessage,
    setSessionUser,
    destroySession,
};
