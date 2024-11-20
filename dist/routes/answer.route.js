import express from "express";
import answerController from "../controllers/answer.controller.js";
import { ensureAuthenticated } from "../middleware/middleware.js";
const router = express.Router();
router.get("/myAnswers", ensureAuthenticated, answerController.getAnswers);
router.get("/answer/:answerId", ensureAuthenticated, answerController.getAnswerById);
export default router;
