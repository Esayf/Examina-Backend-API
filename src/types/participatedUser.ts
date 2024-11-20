import { Document } from "mongoose";
import { ExamDocument, UserDocument } from "./index.js";

export interface ParticipatedUserDocument extends Document {
	user: UserDocument["_id"];
	exam: ExamDocument["_id"];
	isFinished: boolean;
	isMailSent: boolean;
	jobAdded: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ParticipatedUserWithPopulatedUser extends Document {
	user: UserDocument;
	exam: ExamDocument;
	isFinished: boolean;
	isMailSent: boolean;
	jobAdded: boolean;
}
