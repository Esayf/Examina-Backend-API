import mongoose, { Schema } from "mongoose";
import { ParticipatedUserDocument } from "@/typings";

const ParticipatedUserSchema = new Schema(
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
		nickname: {
			type: String,
			required: true,
		},
		isFinished: {
			type: Boolean,
			default: false,
		},
		finishTime: {
			type: Date,
			required: false,
		},
		isWinner: {
			type: Boolean,
			default: false,
		},
		isRewardSent: {
			type: Boolean,
			default: false,
		},
		rewardSentDate: {
			type: Date,
		},
		rewardAmount: {
			type: Number,
		},
		isMailSent: {
			type: Boolean,
			default: false,
		},
		jobAdded: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<ParticipatedUserDocument>("ParticipatedUser", ParticipatedUserSchema);
