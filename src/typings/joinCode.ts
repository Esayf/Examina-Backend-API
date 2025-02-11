import { Document } from "mongoose";
import { ExamDocument } from "./sharedTypes";

export interface JoinCode extends Document {
	exam: ExamDocument;
	joinCode: string;
}
