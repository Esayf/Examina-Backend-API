import express from "express";
import userController from "../controllers/user.controller";
import {
	ensureAuthenticated,
	ensureAdmin,
	validateSessionToken,
	validateRequestedEmail,
	verifyUserSignature,
} from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { userSchemas } from "@/schemas/user.schema";

const router = express.Router();

router.get(
	"/session/get-message-to-sign/:walletAddress",
	validateRequest({ params: userSchemas.params }),
	userController.getMessageToSign
);

router.post(
	"/register",
	validateSessionToken,
	validateRequest({ body: userSchemas.register }),
	verifyUserSignature,
	userController.registerUser
);

if (process.env.NODE_ENV === "development") {
	router.post("/register/dev", userController.registerUser);
}

router.get("/session", userController.getSession);
router.post("/logout", ensureAuthenticated, userController.logout);
router.get("/", ensureAuthenticated, ensureAdmin, userController.getAllUsers);
router.post(
	"/put/email",
	ensureAuthenticated,
	validateRequest({ body: userSchemas.putEmail }),
	userController.putEmail
);

export default router;
