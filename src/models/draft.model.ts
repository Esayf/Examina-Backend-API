import mongoose, { Schema } from "mongoose";
import { DraftDocument } from "../types";

const DraftSchema = new Schema(
	{
		creator: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
		},
		startDate: {
			type: Date,
		},
		duration: {
			type: Number,
		},
		rootHash: {
			type: String,
		},
		secretKey: {
			type: String,
		},
		questionCount: {
			type: Number,
		},
		isRewarded: {
			type: Boolean,
		},
		rewardPerWinner: {
			type: Number,
		},
		passingScore: {
			type: Number,
		},
		questions: [
			{
				text: String,
				options: [
					{
						number: Number,
						text: String,
					},
				],
				correctAnswer: Number,
				number: Number,
			},
		],
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<DraftDocument>("Draft", DraftSchema);
