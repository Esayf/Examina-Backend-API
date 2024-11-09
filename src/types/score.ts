import { Document } from "mongoose";

export interface ScoreDocument extends Document {
	user: string;
	exam: string;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	createdAt: Date;
}

export interface PopulatedScoreDocument extends Omit<ScoreDocument, "user" | "exam"> {
	user: {
		username: string;
		walletAddress: string;
	};
	exam: {
		title: string;
	};
}
