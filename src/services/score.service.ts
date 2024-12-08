import { Answer, AnswerKey, ScoreDocument } from "../types";
import Score from "../models/score.model";
import * as workerAPI from "../zkcloudworker/workerAPI";

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

async function calculateScore(userAnswers: Answer[], answerKey: AnswerKey[]) {
	let correctAnswers = 0;

	userAnswers.forEach((userAnswer) => {
		const question = answerKey.find((key) => key.questionId.toString() === userAnswer.questionId.toString());
		if (question && question.correctAnswer.toString() === userAnswer.answer.toString()) {
			correctAnswers++;
		}
	});
	// Make sure that userAnswers.questionId order in the array is the same as answerKey.questionId order in the array
	const sortedUserAnswers = userAnswers.sort(
		(a, b) =>
			answerKey.findIndex((key) => key.questionId.toString() === a.questionId.toString()) -
			answerKey.findIndex((key) => key.questionId.toString() === b.questionId.toString())
	);
	// Get exam correct answers as an array
	//const examCorrectAnswers = answerKey.map((answer) => answer.correctAnswer.toString());
	/* 	const zkProgramScoreCalculationProof = await workerAPI.calculateScore({
			userAnswers: { answers: sortedUserAnswers.map((answer) => answer.answer.toString()) },
			correctAnswers: { answers: examCorrectAnswers },
		}); */
	//console.log("ZK Program Score Calculation score: ", zkProgramScoreCalculationProof.score);
	const score = ((correctAnswers / answerKey.length) * 100).toFixed(2).toString();

	return { score, correctAnswers };
}

export default {
	getAll,
	getScoresByExamId,
	createScore,
	calculateScore,
};
