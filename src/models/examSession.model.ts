import mongoose, { Schema } from "mongoose";

export interface ExamSessionDocument extends mongoose.Document {
	examId: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	startTime: Date;
	endTime?: Date;
	isCompleted: boolean;
	remainingTime: number; // in minutes
	createdAt: Date;
	updatedAt: Date;
}

/**
 * @typedef {object} ExamSession
 * @property {string} examId.required - The exam ID
 * @property {string} userId.required - The participant's user ID
 * @property {Date} startTime.required - When the participant started
 * @property {Date} endTime - When the participant finished/timeout
 * @property {boolean} isCompleted - Whether session is completed
 * @property {number} remainingTime - Remaining time in minutes
 */
const ExamSessionSchema = new Schema(
	{
		examId: {
			type: Schema.Types.ObjectId,
			ref: "Exam",
			required: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		startTime: {
			type: Date,
			required: true,
			default: Date.now,
		},
		endTime: {
			type: Date,
			required: false,
		},
		isCompleted: {
			type: Boolean,
			default: false,
		},
		remainingTime: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{
		timestamps: true,
	}
);

// Compound index to ensure one active session per user per exam
ExamSessionSchema.index({ examId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ExamSessionDocument>("ExamSession", ExamSessionSchema);
