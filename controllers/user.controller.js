const userService = require("../services/user.service");
const sessionHelper = require("../helpers/sessionHelper");

async function getMessageToSign(req, res) {
	const { walletAddress } = req.params;
	const message = sessionHelper.createTokenAndMessage(req, walletAddress);
	res.json({ message: message });
}

async function registerUser(req, res) {
	const { walletAddress } = req.body;
	try {
		await userService.registerOrCreateUser(req, walletAddress);
		res.status(200).json({ success: true, session: req.session.user });
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

async function getAllUsers(req, res) {
	try {
		const users = await userService.findAllUsers();
		res.status(200).json(users);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	}
}

async function putEmail(req, res) {
	const { email } = req.body;
	try {
		const user = await userService.updateUserEmail(
			req.session.user.userId,
			email
		);
		res.status(200).json({ success: true, user: user });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	}
}

module.exports = {
	getMessageToSign,
	registerUser,
	getSession,
	logout,
	getAllUsers,
	putEmail,
};
