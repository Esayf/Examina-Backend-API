import express from "express";
import questionController from "../controllers/question.controller";
import { ensureAuthenticated, ensureAdmin } from "../middleware/middleware";

const router = express.Router();

router.get("/question/:questionId", ensureAuthenticated, ensureAdmin, questionController.getQuestionById);
router.get("/:examId", ensureAuthenticated, questionController.getExamQuestions);

export default router;
