import mongoose, { Schema } from "mongoose";
import { AnswerDocument } from "../types";

const AnswerSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		exam: {
			type: Schema.Types.ObjectId,
			ref: "Exam",
			required: true,
		},
		answers: [
			{
				question: {
					type: Schema.Types.ObjectId,
					ref: "Question",
					required: true,
				},
				selectedOption: {
					type: Schema.Types.Mixed,
					required: true,
				},
				answerHash: {
					type: String,
					required: true,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<AnswerDocument>("Answer", AnswerSchema);
