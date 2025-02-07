import { Answer, AnswerKey, ScoreDocument } from "@/typings";
import Score from "../models/score.model";
import * as workerAPI from "../zkcloudworker/workerAPI";

async function getAll(): Promise<ScoreDocument[]> {
	try {
		return await Score.find().populate("user", "username walletAddress").populate("exam", "title");
	} catch (error) {
		console.error("Error finding scores: ", error);
		throw new Error("Error finding scores");
	}
}

async function getScoresByExamId(examId: string): Promise<ScoreDocument[]> {
	try {
		return await Score.find({ exam: examId }).populate("user", "username walletAddress").populate("exam", "title");
	} catch (error) {
		console.error("Error fetching scores for exam: ", error);
		throw new Error("Error fetching scores for exam");
	}
}

interface ScoreData {
	user: string;
	exam: string;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
}

async function createScore(scoreData: ScoreData): Promise<ScoreDocument> {
	try {
		const score = new Score(scoreData);
		return await score.save();
	} catch (error) {
		console.error("Error creating score: ", error);
		throw new Error("Error creating score");
	}
}

async function calculateScore(userAnswers: Answer[], answerKey: AnswerKey[]) {
	let correctAnswers = 0;
	let weightedScore = 0;
	let totalPossibleWeightedScore = 0;

	const getDifficultyMultiplier = (difficulty: number): number => {
		switch (difficulty) {
			case 1:
				return 1; // Very Easy (Default): 1x weight
			case 2:
				return 1.5; // Easy: 1.5x weight
			case 3:
				return 2; // Moderate: 2x weight
			case 4:
				return 2.5; // Hard: 2.5x weight
			case 5:
				return 3; // Very Hard: 3x weight
			default:
				return 1; // Default: 1x
		}
	};

	userAnswers.forEach((userAnswer) => {
		const question = answerKey.find((key) => key.questionId.toString() === userAnswer.questionId.toString());
		if (question && question.difficulty) {
			const multiplier = getDifficultyMultiplier(question.difficulty);

			if (question.correctAnswer.toString() === userAnswer.answer.toString()) {
				correctAnswers++;
				weightedScore += 10 * multiplier;
			}

			totalPossibleWeightedScore += 10 * multiplier;
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

	// TODO: Changing Score Calculation System
	const normalizedWeightedScore = ((weightedScore / totalPossibleWeightedScore) * 100).toFixed(2);

	return {
		score: normalizedWeightedScore,
		correctAnswers,
	};
}

export default {
	getAll,
	getScoresByExamId,
	createScore,
	calculateScore,
};
