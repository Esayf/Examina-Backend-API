const express = require("express");
const router = express.Router();
const questionController = require("../controllers/question.controller");
const {
	ensureAuthenticated,
	ensureAdminAccess,
} = require("../middleware/middleware");

router.get(
	"/question/:questionId",
	ensureAdminAccess,
	questionController.getQuestionById
);

router.get(
	"/:examId",
	ensureAuthenticated,
	questionController.getExamQuestions
);

module.exports = router;
