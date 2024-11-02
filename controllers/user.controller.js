const userService = require("../services/user.service");
const sessionHelper = require("../helpers/sessionHelper");

async function getMessageToSign(req, res) {
	try {
		const { walletAddress } = req.params;
		const message = sessionHelper.createTokenAndMessage(req, walletAddress);
		return res.json({ message: message });
	} catch (error) {
		console.log("Error message creating: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function registerUser(req, res) {
	const { walletAddress } = req.body;
	try {
		await userService.registerOrLogin(req, walletAddress);
		return res
			.status(201)
			.json({ success: true, session: req.session.user });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getSession(req, res) {
	return res.status(200).json({ success: true, session: req.session.user });
}

async function logout(req, res) {
	sessionHelper.destroySession(req, (err) => {
		if (err) {
			return res.status(500).json({ message: "Failed to logout" });
		}
		return res.json({ success: true, message: "Logged out" });
	});
}

async function getAllUsers(req, res) {
	try {
		const users = await userService.getAll();
		if (!users) {
			return res.status(404).json({ message: "Users not found" });
		}
		return res.status(200).json(users);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function putEmail(req, res) {
	const { email } = req.body;
	try {
		const user = await userService.updateEmail(
			req.session.user.userId,
			email
		);
		return res.status(200).json({ success: true, user: user });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function createAdmin(req, res) {
	const { walletAddress } = req.body;
	try {
		await userService.createOrPromote(req, walletAddress);
		return res
			.status(201)
			.json({ success: true, session: req.session.user });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

module.exports = {
	getMessageToSign,
	registerUser,
	getSession,
	logout,
	getAllUsers,
	putEmail,
	createAdmin,
};
