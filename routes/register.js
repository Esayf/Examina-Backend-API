const express = require("express");
const userController = require("../controllers/userController");
const userService = require("../services/userService");
const isAuthenticated = require("../middleware/auth");
const sessionHelper = require("../helpers/sessionHelper");

const router = express.Router();

router.get(
	"/session/get-message-to-sign/:walletAddress",
	userController.getMessageToSign
);
router.post("/", userController.registerUser);
router.get("/session", isAuthenticated, userController.getSession);
router.post("/logout", isAuthenticated, userController.logout);

if (process.env.NODE_ENV === "development") {
	router.post("/dev", async (req, res) => {
		const { walletAddress, email } = req.body;
		try {
			const user = await userService.findUserByWalletAddress(
				walletAddress
			);
			if (user.length === 0) {
				const newUser = await userService.createUser(
					walletAddress,
					email
				);
				sessionHelper.setSessionUser(req, newUser);
				return res
					.status(200)
					.json({ success: true, user: req.session.user });
			} else {
				sessionHelper.setSessionUser(req, user[0]);
				return res
					.status(200)
					.json({ success: true, user: req.session.user });
			}
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: "Internal server error" });
		}
	});
}

module.exports = router;
