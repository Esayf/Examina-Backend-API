const express = require("express");
const userController = require("../controllers/user.controller");
const isAuthenticated = require("../middleware/auth");
const checkSessionToken = require("../middleware/checkSessionToken");
const verifySignature = require("../middleware/verifySignature");
const isEmailValid = require("../middleware/isEmailValid");

const router = express.Router();

router.get(
	"/session/get-message-to-sign/:walletAddress",
	userController.getMessageToSign
);
router.post(
	"/register",
	checkSessionToken,
	verifySignature,
	userController.registerUser
);
if (process.env.NODE_ENV === "development") {
	router.post("/register/dev", userController.registerUser);
}
router.get("/session", isAuthenticated, userController.getSession);
router.post("/logout", isAuthenticated, userController.logout);

// SHOULD THERE BE A CONTROL?
router.get("/", userController.getAllUsers);

// SHOULD IT BE "PUT" OR "POST" REQUEST?
router.post(
	"/put/email",
	isAuthenticated,
	isEmailValid,
	userController.putEmail
);

module.exports = router;
