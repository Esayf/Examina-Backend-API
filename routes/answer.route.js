const express = require("express");
const router = express.Router();
const answerController = require("../controllers/answer.controller");
const {
	ensureAuthenticated,
	ensureAdminAccess,
} = require("../middleware/middleware");

router.get("/myAnswers", ensureAuthenticated, answerController.getAnswers);
router.get(
	"/answer/:answerId",
	ensureAdminAccess,
	answerController.getAnswerById
);

module.exports = router;
