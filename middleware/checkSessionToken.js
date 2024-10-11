const checkSessionToken = (req, res, next) => {
	const message = req.session.message;
	const token = req.session.token;

	if (!message || !token) {
		return res
			.status(401)
			.json({ success: false, message: "No session token" });
	}

	next();
};

module.exports = checkSessionToken;
