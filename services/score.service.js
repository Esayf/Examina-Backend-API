const Score = require("../models/score.model");

async function getAll() {
	try {
		const scores = await Score.find();
		return scores;
	} catch (error) {
		console.error("Error finding scores:", error);
		throw new Error("Error finding scores");
	}
}

async function getScoresByExamId(examId) {
	try {
		const scores = await Score.find({ exam: examId });
		return scores;
	} catch (error) {
		console.error("Error fetching scores for exam:", error);
		throw new Error("Error fetching scores for exam");
	}
}

module.exports = {
	getAll,
	getScoresByExamId,
};
