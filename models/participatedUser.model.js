const mongoose = require("mongoose");
const Counter = require("./Counter");

const ParticipatedUserSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	exam: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Exam",
		required: true,
	},
	isFinished: { type: Boolean, default: false },
	isMailSent: { type: Boolean, default: false },
	jobAdded: { type: Boolean, default: false }, // New field to mark if a job has been added

}, autoCreate = true)

ParticipatedUserSchema.index({ isMailSent: 1, isFinished: 1 });

module.exports = mongoose.model("ParticipatedUser", ParticipatedUserSchema);