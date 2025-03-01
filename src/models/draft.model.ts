import mongoose, { Schema } from "mongoose";
import { DraftDocument } from "@/typings";

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
		questionCount: {
			type: Number,
		},
		isRewarded: {
			type: Boolean,
		},
		rewardPerWinner: {
			type: Number,
		},
		totalRewardPoolAmount: {
			type: Number,
		},
		passingScore: {
			type: Number,
		},
		isPrivate: {
			type: Boolean,
			default: false,
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
				questionType: String,
				difficulty: Number,
			},
		],
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<DraftDocument>("Draft", DraftSchema);
