import mongoose, { Schema } from "mongoose";
import { QuestionDocument } from "@/typings";

const QuestionSchema = new Schema(
	{
		exam: {
			type: Schema.Types.ObjectId,
			ref: "Exam",
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		options: [
			{
				number: {
					type: Number,
					required: true,
				},
				text: {
					type: String,
					required: true,
				},
			},
		],
		correctAnswer: {
			type: Number,
			required: true,
		},
		number: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<QuestionDocument>("Question", QuestionSchema);
