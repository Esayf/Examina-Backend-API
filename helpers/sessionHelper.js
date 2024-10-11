function getSessionUser(req) {
	return req.session.user || null;
}

function setSessionUser(req, user) {
	req.session.user = {
		userId: user._id,
		walletAddress: user.walletAddress,
	};
}

function destroySession(req, callback) {
	req.session.destroy(callback);
}

module.exports = {
	getSessionUser,
	setSessionUser,
	destroySession,
};
