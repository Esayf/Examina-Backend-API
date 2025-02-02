import express from "express";
import answerController from "../controllers/answer.controller";
import { ensureAuthenticated, ensureAdmin } from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { answerSchemas } from "../schemas/answer.schema";

const router = express.Router();

router.use(ensureAuthenticated);

router.get("/myAnswers", validateRequest({ body: answerSchemas.getAnswers }), answerController.getAnswers);
router.get(
	"/answer/:answerId",
	validateRequest({ params: answerSchemas.params }),
	ensureAdmin,
	answerController.getAnswerById
);

export default router;
