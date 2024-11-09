import { Document } from "mongoose";
import { UserDocument } from "./index";

export interface ParticipatedUserWithPopulatedUser extends Document {
	user: UserDocument;
	exam: string;
	isFinished: boolean;
	isMailSent: boolean;
	jobAdded: boolean;
}
