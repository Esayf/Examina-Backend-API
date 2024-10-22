const { validateEmail } = require("../helpers/helperFunctions");
const helperFunctions = require("../helpers/helperFunctions");

const ensureAuthenticated = (req, res, next) => {
	if (!req.session.user) {
		return res.status(401).json({ message: "Unauthorized!" });
	}
	next();
};

const validateSessionToken = (req, res, next) => {
	const message = req.session.message;
	const token = req.session.token;

	if (!message || !token) {
		return res
			.status(401)
			.json({ success: false, message: "No session token" });
	}

	next();
};

const validateRequestedEmail = (req, res, next) => {
	const { email } = req.body;
	if (!validateEmail(email)) {
		return res.status(400).json({ message: "Invalid email" });
	}
	next();
};

const verifyUserSignature = (req, res, next) => {
	const { walletAddress, signature } = req.body;
	const message = req.session.message;

	const verifyResult = helperFunctions.verifySignature(
		message,
		walletAddress,
		signature
	);

	if (!verifyResult) {
		return res
			.status(401)
			.json({ success: false, message: "Invalid signature" });
	}

	next();
};
module.exports = {
	ensureAuthenticated,
	validateSessionToken,
	validateRequestedEmail,
	verifyUserSignature,
};
