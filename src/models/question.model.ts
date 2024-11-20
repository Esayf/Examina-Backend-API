import mongoose, { Schema } from "mongoose";
import { QuestionDocument } from "../types/index.js";
import Counter from "./counter.model.js";

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
		uniqueId: {
			type: Number,
			unique: true,
		},
	},
	{
		timestamps: true,
	}
);

QuestionSchema.pre("save", async function (next) {
	const doc = this;
	if (doc.isNew) {
		try {
			const counter = await Counter.findOneAndUpdate(
				{ _id: "questionId" },
				{ $inc: { seq: 1 } },
				{ new: true, upsert: true }
			);
			doc.uniqueId = counter.seq;
			next();
		} catch (error) {
			next(error as Error);
		}
	} else {
		next();
	}
});

export default mongoose.model<QuestionDocument>("Question", QuestionSchema);
