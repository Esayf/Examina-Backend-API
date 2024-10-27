const express = require("express");
const router = express.Router();
const questionController = require("../controllers/question.controller");
const { ensureAuthenticated } = require("../middleware/middleware");

// TODO: admin auth
router.get("/question/:questionId", questionController.getQuestionById);

router.get(
	"/:examId",
	ensureAuthenticated,
	questionController.getExamQuestions
);

module.exports = router;
