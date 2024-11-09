import express from "express";
import answerController from "../controllers/answer.controller";
import { ensureAuthenticated, ensureAdmin } from "../middleware/middleware";

const router = express.Router();

router.get("/myAnswers", ensureAuthenticated, answerController.getAnswers);
router.get("/answer/:answerId", ensureAuthenticated, ensureAdmin, answerController.getAnswerById);

export default router;
