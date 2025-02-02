import express from "express";
import questionController from "../controllers/question.controller";
import { ensureAuthenticated, ensureAdmin } from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { questionSchemas } from "../schemas/question.schema";

const router = express.Router();

router.use(ensureAuthenticated);

router.get(
	"/question/:questionId",
	validateRequest({ params: questionSchemas.questionIdParams }),
	ensureAdmin,
	questionController.getQuestionById
);
router.get(
	"/:examId",
	validateRequest({ params: questionSchemas.examIdParams }),
	questionController.getQuestionsByExam
);

export default router;
