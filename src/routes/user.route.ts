import express from "express";
import userController from "../controllers/user.controller.js";
import { ensureAuthenticated, validateRequestedEmail } from "../middleware/middleware.js";

const router = express.Router();

router.get("/session/get-message-to-sign/:walletAddress", userController.getMessageToSign);

router.post("/register", userController.registerUser);

router.post("/register/dev", userController.registerUser);

router.get("/session", userController.getSession);
router.post("/logout", ensureAuthenticated, userController.logout);
router.get("/", ensureAuthenticated, userController.getAllUsers);
router.post("/put/email", ensureAuthenticated, validateRequestedEmail, userController.putEmail);

export default router;
