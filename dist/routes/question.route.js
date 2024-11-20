import express from "express";
import questionController from "../controllers/question.controller.js";
import { ensureAuthenticated } from "../middleware/middleware.js";
const router = express.Router();
router.get("/question/:questionId", ensureAuthenticated, questionController.getQuestionById);
router.get("/:examId", ensureAuthenticated, questionController.getExamQuestions);
export default router;
