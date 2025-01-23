import { Request } from "express";
import { Document, Types } from "mongoose";
import { Session } from "express-session";
import { ParamsDictionary } from "express-serve-static-core";

interface UserDocument extends Document {
	username: string;
	walletAddress: string;
	email?: string;
	isAdmin: boolean;
}

interface SessionUser {
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

interface CustomRequest extends Request<ParamsDictionary, any, any, any> {
	session: Session;
}

interface ExamDocument extends Document {
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
	contractAddress?: string;
	deployJobId?: string;
	passingScore?: number;
	isPrivate?: boolean;
	isWinnerlistRequested?: boolean;
}

type Winner = {
	walletAddress: string;
	score: number;
	finishTime: Date;
};

type Participant = {
	userId: string;
	nickname: string; // TODO: Will be nicknames after random nickname implementation. For now username it is.
	walletAddress: string;
	score?: string;
	finishTime: Date;
};

type Leaderboard = {
	nickname: string;
	score: string | any;
	finishTime: Date;
}[];

interface ExtendedExamDocument extends ExamDocument {
	_id: string;
	winnerlist?: Winner[];
	participants?: Participant[];
	leaderboard?: Leaderboard;
}

interface CreateExamDto
	extends Omit<
		ExamDocument,
		"contractAddress" | "deployJobId" | "secretKey" | "isDistributed" | "isFinished" | "isCompleted"
	> {}

interface QuestionDocument extends Document {
	exam: string;
	text: string;
	options: Array<{
		number: number;
		text: string;
	}>;
	correctAnswer: number;
	number: number;
}

interface QuestionResponseDocument extends Omit<QuestionDocument, "correctAnswer"> {}

interface QuestionInput {
	number: number;
	text: string;
	options: Array<{ number: number; text: string }>;
	correctAnswer: number;
}

interface ParticipatedUserDocument extends Document {
	user: string;
	exam: string;
	isFinished: boolean;
	finishTime?: Date;
	isWinner: boolean;
	isMailSent: boolean;
	jobAdded: boolean;
	isRewardSent: boolean;
	rewardSentDate: Date | null;
	rewardAmount: number | null;
}

interface AnswerDocument extends Document {
	user: string;
	exam: string;
	answers: Array<{
		question: string;
		selectedOption: any;
		answerHash: string;
	}>;
}

interface PasscodeDocument extends Document {
	exam: string; // Exam ile ilişki
	passcode: string; // Benzersiz passcode
	isUsed: boolean; // Kullanılıp kullanılmadığı bilgisi
	// expiresAt: Date; // Son kullanma tarihi
}

interface Answer {
	questionId: string;
	answer: number;
}

interface ProcessedAnswer {
	question: string;
	selectedOption: number;
	answerHash: string;
}

interface AnswerKey {
	questionId: string;
	correctAnswer: number;
}

interface DraftDocument extends Document {
	creator: Types.ObjectId;
	title: string;
	description?: string;
	startDate?: Date;
	duration?: number;
	rootHash?: string;
	secretKey?: string;
	questionCount?: number;
	isRewarded?: boolean;
	rewardPerWinner?: number;
	passingScore?: number;
	questions?: Array<{
		text?: string;
		options?: Array<{
			number: number;
			text?: string;
		}>;
		correctAnswer?: number;
		number: number;
	}>;
	createdAt: Date;
	updatedAt: Date;
}

export {
	UserDocument,
	SessionUser,
	CustomRequest,
	ExamDocument,
	ExtendedExamDocument,
	Winner,
	Participant,
	Leaderboard,
	CreateExamDto,
	QuestionDocument,
	QuestionResponseDocument,
	QuestionInput,
	ParticipatedUserDocument,
	AnswerDocument,
	PasscodeDocument,
	Answer,
	ProcessedAnswer,
	AnswerKey,
	DraftDocument,
};
