const Question = require("../models/question.model");
const { checkExamTimes } = require("../helpers/helperFunctions");
const { map_questions, project_questions } = require("../models/projections");
const participatedUserService = require("./participatedUser.service");
const examService = require("./exam.service");

async function getAllByExam(examId, userId) {
	try {
		const exam = await examService.getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		// Check if the exam has started or ended
		const examTimeCheck = checkExamTimes(exam);
		if (!examTimeCheck.valid) {
			return { status: 400, message: examTimeCheck.message };
		}

		// Check if the user has participated
		const participationResult =
			await participatedUserService.checkParticipation(userId, examId, {
				createIfNotExist: false,
			});

		if (!participationResult.success) {
			return {
				status: participationResult.status,
				message: participationResult.message,
			};
		}

		// Retrieve the questions for the exam
		const questions = await Question.find(
			{ exam: examId },
			map_questions
		).sort({ number: 1 });

		return { status: 200, data: questions };
	} catch (err) {
		console.error("Error fetching exam questions:", err);
		throw new Error("Error fetching exam questions");
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
