function createTokenAndMessage(req, walletAddress) {
	const token = Math.random().toString(36).substring(7);
	req.session.token = token;
	const message = `${req.session.token}${walletAddress}`;
	req.session.message =
		process.env.NODE_ENV == "test" ? { message } : message;
	return message;
}

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
	createTokenAndMessage,
	setSessionUser,
	destroySession,
};
