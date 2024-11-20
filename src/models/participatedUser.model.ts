import mongoose, { Schema } from "mongoose";
import { ParticipatedUserDocument } from "../types/participatedUser.js";

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
		isFinished: {
			type: Boolean,
			default: false,
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
