const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");
const {
	ensureAuthenticated,
	validateBody,
} = require("../middleware/middleware");

// TODO: add body validation
router.post("/create", ensureAuthenticated, examController.createExam);
router.get("/myExams", ensureAuthenticated, examController.getAllExams);
router.get("/:id", examController.getExamById);
router.post("/startExam", ensureAuthenticated, examController.startExam);
// Q1: Should this route be in another route file like "question.route"?
// Q2: ensureAuth?
router.get(
	"/:id/questions",
	ensureAuthenticated,
	examController.getExamQuestions
);

router.post(
	"/finishExam",
	ensureAuthenticated,
	validateBody,
	examController.finishExam
);

module.exports = router;
