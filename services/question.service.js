const Question = require("../models/Question");
const { map_questions } = require("../models/projections");

async function getAllByExam(examId) {
	try {
		const questions = await Question.find(
			{ exam: examId },
			map_questions
		).sort({ number: 1 });
		return questions;
	} catch (error) {
		console.log("Error fetching questions: ", error);
		throw new Error("Error fetching questions");
	}
}

module.exports = { getAllByExam };
