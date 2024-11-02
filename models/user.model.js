const mongoose = require("mongoose");
const Counter = require("./Counter");
const userSchema = new mongoose.Schema(
	{
		uniqueId: { type: Number, unique: true },
		username: {
			type: String,
			required: true,
		},
		email: {
			type: String,
		},
		walletAddress: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
	},
	(autoCreate = true)
).pre("save", async function (next) {
	const doc = this;

	if (doc.isNew) {
		try {
			// Find the counter by ID (e.g., 'uniqueId') and increment the sequence value by 1
			const counter = await Counter.findOneAndUpdate(
				{ _id: "uniqueId" }, // Use a unique ID to identify the counter for this schema
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

module.exports = mongoose.model("User", userSchema);
