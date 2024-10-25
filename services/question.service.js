const Question = require("../models/question.model");
const { map_questions, project_questions } = require("../models/projections");

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

async function getById(questionId) {
	try {
		const question = await Question.findById(questionId).select(
			project_questions
		);

		return question;
	} catch (error) {
		console.error("Error fetching question:", error);
		throw new Error("Error fetching question");
	}
}

module.exports = {
	getAllByExam,
	getById,
};
