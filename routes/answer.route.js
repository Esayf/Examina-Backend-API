const express = require("express");
const router = express.Router();
const answerController = require("../controllers/answer.controller");
const { ensureAuthenticated } = require("../middleware/middleware");

router.get("/myAnswers", ensureAuthenticated, answerController.getAnswers);
// TODO: admin auth
router.get("/answer/:answerId", answerController.getAnswerById);

module.exports = router;