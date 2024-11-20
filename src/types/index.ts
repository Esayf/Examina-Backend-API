import { Request } from "express";
import { Document } from "mongoose";
import { Session } from "express-session";
import { ParamsDictionary } from "express-serve-static-core";

export interface UserDocument extends Document {
	username: string;
	walletAddress: string;
	email?: string;
	isAdmin: boolean;
}

export interface SessionUser {
	userId: string;
	walletAddress: string;
	isAdmin: boolean;
}

// Extend the Session interface
declare module "express-session" {
	interface Session {
		stableId?: string;
		user?: SessionUser;
		token?: string;
		message?: string | { message: string };
	}
}
export interface ExamDocument extends Document {
	creator: string;
	title: string;
	description: string;
	startDate: Date;
	duration: number;
	rootHash: string;
	secretKey: string;
	questionCount: number;
	isCompleted?: boolean;
}

export interface QuestionDocument extends Document {
	exam: string;
	text: string;
	options: Array<{
		number: number;
		text: string;
	}>;
	correctAnswer: number;
	number: number;
	uniqueId: string;
}

export interface QuestionInput {
	number: number;
	text: string;
	options: Array<{ number: number; text: string }>;
	correctAnswer: number;
}

export interface ParticipatedUserDocument extends Document {
	user: string;
	exam: string;
	isFinished: boolean;
	isMailSent: boolean;
	jobAdded: boolean;
}

export interface AnswerDocument extends Document {
	user: string;
	exam: string;
	answers: Array<{
		question: string;
		selectedOption: any;
		answerHash: string;
	}>;
}

export interface Answer {
	questionId: string;
	answer: number;
}

export interface ProcessedAnswer {
	question: string;
	selectedOption: number;
	answerHash: string;
}

export interface AnswerKey {
	questionId: string;
	questionNumber: number;
	correctAnswer: number;
}

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
