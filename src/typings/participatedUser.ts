import { Document } from "mongoose";
import { ExamDocument, UserDocument } from "./sharedTypes";

export interface ParticipatedUserWithPopulatedUser extends Document {
	user: UserDocument;
	exam: ExamDocument;
	isFinished: boolean;
	isMailSent: boolean;
	jobAdded: boolean;
	isDistributed: boolean;
	isWinner: boolean;
}
