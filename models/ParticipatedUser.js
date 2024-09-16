const mongoose = require("mongoose");

const ParticipatedUserSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	examId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Exam",
		required: true,
	},
	participated: { type: Boolean, default: false },
});

module.exports = mongoose.model("ParticipatedUser", ParticipatedUserSchema);
