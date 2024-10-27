const Answer = require("../models/answer.model");
const { generateAnswerArray } = require("../helpers/helperFunctions");

async function get(userId, examId) {
	try {
		const answer = await Answer.findOne({ user: userId, exam: examId });
		return answer;
	} catch (error) {
		console.log("Error fetching answer: ", error);
		throw new Error("Error fetching answer");
	}
}

async function create(userId, examId, answer, walletAddress) {
	const userAnswers = new Answer({
		user: userId,
		exam: examId,
		answers: generateAnswerArray(answer, walletAddress),
	});
	try {
		await userAnswers.save();
	} catch (error) {
		console.log("Error saving answer: ", error);
		throw new Error("Error saving answer");
	}
}

async function getById(answerId) {
	try {
		const answer = await Answer.findById(answerId);

		return answer;
	} catch (error) {
		console.error("Error fetching answer:", error);
		throw new Error("Error fetching answer");
	}
}

module.exports = { get, create, getById };
