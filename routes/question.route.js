const express = require("express");
const router = express.Router();
const questionController = require("../controllers/question.controller");

// TODO: admin auth
router.get("/question/:questionId", questionController.getQuestionById);

module.exports = router;
