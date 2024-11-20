import mongoose, { Schema } from "mongoose";
import { ExamDocument } from "../types/index.js";
import Counter from "./counter.model.js";

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
 * @property {number} uniqueId - Unique identifier
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
		isCompleted: {
			type: Boolean,
			default: false,
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

ExamSchema.pre("save", async function (next) {
	const doc = this;
	if (doc.isNew) {
		try {
			const counter = await Counter.findOneAndUpdate(
				{ _id: "examId" },
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

export default mongoose.model<ExamDocument>("Exam", ExamSchema);
