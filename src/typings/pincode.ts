import { Document } from "mongoose";
import { ExamDocument } from "./sharedTypes";

export interface PincodeDocument extends Document {
	exam: ExamDocument;
	pincode: string;
}
