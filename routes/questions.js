const express = require("express");
const Exam = require("../models/exam.model");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const questions = await Question.find({});
		res.status(200).json(questions);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

module.exports = router;
