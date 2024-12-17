import mongoose, { Schema } from "mongoose";
import { ScoreDocument } from "../types";

const ScoreSchema = new Schema(
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
		score: {
			type: Number,
			required: true,
		},
		totalQuestions: {
			type: Number,
			required: true,
		},
		correctAnswers: {
			type: Number,
			required: true,
		},
		// Is this necessary?
		isWinner: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export default mongoose.model<ScoreDocument>("Score", ScoreSchema);
