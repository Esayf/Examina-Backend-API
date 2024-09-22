const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "User",
	},
	title: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		required: false,
	},
	duration: {
		type: Number,
		required: false,
	},
	startDate: {
		type: Date,
		required: false,
	},
	rootHash: {
		type: String,
		required: true,
	},
	contractAddress: {
		type: String,
		required: false,
	},
	secretKey: {
		type: String,
		required: true,
	},
	isCompleted: {
		type: Boolean,
		default: false,
	},
	questionCount: {
		type: Number	
	},
}, autoCreate = true);

module.exports = mongoose.model("Exam", ExamSchema);
