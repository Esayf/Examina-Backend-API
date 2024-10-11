const express = require("express");
const userController = require("../controllers/user.controller");
const isAuthenticated = require("../middleware/auth");
const checkSessionToken = require("../middleware/checkSessionToken");
const verifySignature = require("../middleware/verifySignature");

const router = express.Router();

router.get(
	"/session/get-message-to-sign/:walletAddress",
	userController.getMessageToSign
);
router.post(
	"/",
	checkSessionToken,
	verifySignature,
	userController.registerUser
);
router.get("/session", isAuthenticated, userController.getSession);
router.post("/logout", isAuthenticated, userController.logout);

if (process.env.NODE_ENV === "development") {
	router.post("/dev", userController.registerUser);
}

module.exports = router;
