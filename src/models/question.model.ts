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
		questionType: {
			type: String,
			enum: ["mc", "tf"],
			required: true,
		},
		number: {
			type: Number,
			required: true,
		},
		difficulty: {
			type: Number,
			default: 1,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<QuestionDocument>("Question", QuestionSchema);
