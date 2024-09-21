const mongoose = require("mongoose");

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
});

module.exports = mongoose.model("ParticipatedUser", ParticipatedUserSchema);
