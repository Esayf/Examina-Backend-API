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
		user?: SessionUser;
		token?: string;
		message?: string | { message: string };
	}
}

export interface CustomRequest extends Request<ParamsDictionary, any, any, any> {
	session: Session;
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
	isRewarded: boolean;
	rewardPerWinner: number;
	isCompleted?: boolean;
	isDistributed?: boolean;
	contractAddress: string;
	deployJobId: string;
	passingScore: number;
	isPrivate?: boolean;
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
	isWinner: boolean;
	isMailSent: boolean;
	jobAdded: boolean;
	isRewardSent: boolean;
	rewardSentDate: Date | null;
	rewardAmount: number | null;
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

export interface PasscodeDocument extends Document {
	exam: string; // Exam ile ilişki
	passcode: string; // Benzersiz passcode
	isUsed: boolean; // Kullanılıp kullanılmadığı bilgisi
	// expiresAt: Date; // Son kullanma tarihi
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
	isWinner: boolean;
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
