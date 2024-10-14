const express = require("express");
const userController = require("../controllers/user.controller");
const {
	ensureAuthenticated,
	validateSessionToken,
	validateRequestedEmail,
	verifyUserSignature,
} = require("../middleware/middleware");

const router = express.Router();

router.get(
	"/session/get-message-to-sign/:walletAddress",
	userController.getMessageToSign
);
router.post(
	"/register",
	validateSessionToken,
	verifyUserSignature,
	userController.registerUser
);
if (process.env.NODE_ENV === "development") {
	router.post("/register/dev", userController.registerUser);
}
router.get("/session", ensureAuthenticated, userController.getSession);
router.post("/logout", ensureAuthenticated, userController.logout);

router.get("/", userController.getAllUsers);

router.post(
	"/put/email",
	ensureAuthenticated,
	validateRequestedEmail,
	userController.putEmail
);

module.exports = router;
