import express from "express";
import answerController from "../controllers/answer.controller";
import { ensureAuthenticated, ensureAdmin } from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { answerSchemas } from "../schemas/answer.schema";

const router = express.Router();

router.use(ensureAuthenticated);

// TODO: get all answers of an exam by admin
// get all answers of a user by user
// change myAnswers to myAnswer

router.get(
	"/myAnswers/:examId",
	validateRequest({ params: answerSchemas.getAnswersParams }),
	answerController.getAnswers
);
router.get(
	"/answer/:answerId",
	validateRequest({ params: answerSchemas.answerParams }),
	ensureAdmin,
	answerController.getAnswerById
);

export default router;
