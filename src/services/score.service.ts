import { ScoreDocument } from "../types";
import Score from "../models/score.model";

async function getAll(): Promise<ScoreDocument[]> {
	try {
		return await Score.find().populate("user", "username walletAddress").populate("exam", "title");
	} catch (error) {
		console.error("Error finding scores:", error);
		throw new Error("Error finding scores");
	}
}

async function getScoresByExamId(examId: string): Promise<ScoreDocument[]> {
	try {
		return await Score.find({ exam: examId }).populate("user", "username walletAddress").populate("exam", "title");
	} catch (error) {
		console.error("Error fetching scores for exam:", error);
		throw new Error("Error fetching scores for exam");
	}
}

async function createScore(scoreData: {
	user: string;
	exam: string;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
}): Promise<ScoreDocument> {
	try {
		const score = new Score({
			user: scoreData.user,
			exam: scoreData.exam,
			score: scoreData.score,
			totalQuestions: scoreData.totalQuestions,
			correctAnswers: scoreData.correctAnswers,
		});
		return await score.save();
	} catch (error) {
		console.error("Error creating score:", error);
		throw new Error("Error creating score");
	}
}

export default {
	getAll,
	getScoresByExamId,
	createScore,
};
