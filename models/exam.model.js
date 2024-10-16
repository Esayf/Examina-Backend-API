const mongoose = require("mongoose");
const Counter = require("./Counter");
const ExamSchema = new mongoose.Schema({
    uniqueId: { type: Number, unique: true },
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
		required: true,
		default: false,
	},
	questionCount: {
		type: Number	
	},
}, autoCreate = true).pre('save', async function (next) {
	const doc = this;
	
	if (doc.isNew) {
	  try {
		// Find the counter by ID (e.g., 'uniqueId') and increment the sequence value by 1
		const counter = await Counter.findOneAndUpdate(
		  { _id: 'uniqueId' },  // Use a unique ID to identify the counter for this schema
		  { $inc: { seq: 1 } }, // Increment the sequence
		  { new: true, upsert: true } // If no counter exists, create a new one
		);
		
		// Set the `uniqueId` field to the incremented sequence value
		doc.uniqueId = counter.seq;
		next();
	  } catch (err) {
		next(err);
	  }
	} else {
	  next();
	}
  });

module.exports = mongoose.model("Exam", ExamSchema);
