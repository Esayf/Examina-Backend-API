import mongoose, { Schema } from "mongoose";
import { PasscodeDocument } from "@/typings";

const PasscodeSchema = new Schema(
	{
		exam: {
			type: Schema.Types.ObjectId,
			ref: "Exam",
			required: true,
		},
		passcode: {
			type: String,
			required: true,
			unique: true,
		},
		isUsed: {
			type: Boolean,
			default: false,
		},
		// expiresAt: {
		// 	type: Date,
		// 	required: true,
		// },
	},
	{
		timestamps: true,
	}
);

// Passcode Model
export default mongoose.model<PasscodeDocument>("Passcode", PasscodeSchema);
