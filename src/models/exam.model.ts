import mongoose, { Schema } from "mongoose";
import { ExamDocument } from "@/typings";

/**
 * @typedef {object} Exam
 * @property {string} creator.required - The creator's ID
 * @property {string} title.required - The title of the exam
 * @property {string} description.required - The description
 * @property {string} startDate.required - The start date
 * @property {number} duration.required - Duration in minutes
 * @property {string} rootHash.required - Root hash
 * @property {string} secretKey.required - Secret key
 * @property {number} questionCount.required - Number of questions
 * @property {boolean} isCompleted - Completion status
 * @property {string} backgroundImage - Background image
 */
const ExamSchema = new Schema(
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
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
		rootHash: {
			type: String,
			required: true,
		},
		secretKey: {
			type: String,
			required: true,
		},
		questionCount: {
			type: Number,
			required: true,
		},
		isRewarded: {
			type: Boolean,
			required: true,
		},
		rewardPerWinner: {
			type: Number,
			default: 0,
		},
		passingScore: {
			type: Number,
			default: 0,
		},
		contractAddress: {
			type: String,
			default: "0x0",
		},
		deployJobId: {
			type: String,
			default: "",
		},
		isCompleted: {
			type: Boolean,
			default: false,
		},
		isDistributed: {
			type: Boolean,
			default: false,
		},
		isPrivate: {
			type: Boolean,
			default: false,
		},
		isWinnerlistRequested: {
			type: Boolean,
			default: false,
		},
		backgroundImage: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<ExamDocument>("Exam", ExamSchema);
