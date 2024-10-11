const userService = require("../services/user.service");
const sessionHelper = require("../helpers/sessionHelper");

async function getMessageToSign(req, res) {
	const { walletAddress } = req.params;
	const token = Math.random().toString(36).substring(7);
	req.session.token = token;
	const message = `${req.session.token}${walletAddress}`;
	req.session.message =
		process.env.NODE_ENV == "test" ? { message } : message;
	res.json({ message: message });
}

async function registerUser(req, res) {
	const { walletAddress } = req.body;
	try {
		let user = await userService.findUserByWalletAddress(walletAddress);
		if (user.length === 0) {
			user = await userService.createUser(walletAddress);
			sessionHelper.setSessionUser(req, user);
			return res
				.status(200)
				.json({ success: true, session: req.session.user });
		} else {
			sessionHelper.setSessionUser(req, user[0]);
			return res
				.status(200)
				.json({ success: true, session: req.session.user });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Internal server error" });
	}
}

async function getSession(req, res) {
	res.json({ success: true, session: req.session.user });
}

async function logout(req, res) {
	sessionHelper.destroySession(req, (err) => {
		if (err) {
			return res.status(500).json({ message: "Failed to logout" });
		}
		res.json({ success: true, message: "Logged out" });
	});
}

module.exports = { getMessageToSign, registerUser, getSession, logout };
