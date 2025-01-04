import express from "express";
import userController from "../controllers/user.controller";
import {
	ensureAuthenticated,
	ensureAdmin,
	validateSessionToken,
	validateRequestedEmail,
	verifyUserSignature,
} from "../middleware/middleware";

const router = express.Router();

router.get("/session/get-message-to-sign/:walletAddress", userController.getMessageToSign);

router.post("/register", validateSessionToken, verifyUserSignature, userController.registerUser);

if (process.env.NODE_ENV === "development") {
	router.post("/register/dev", userController.registerUser);
}

router.get("/session", userController.getSession);
router.post("/logout", ensureAuthenticated, userController.logout);
router.get("/", ensureAuthenticated, ensureAdmin, userController.getAllUsers);
router.post("/put/email", ensureAuthenticated, validateRequestedEmail, userController.putEmail);

export default router;
