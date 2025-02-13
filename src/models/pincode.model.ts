import mongoose, { Schema } from "mongoose";
import { PincodeDocument } from "@/typings";

const PincodeSchema = new Schema(
	{
		exam: {
			type: Schema.Types.ObjectId,
			ref: "Exam",
			required: true,
			unique: true,
		},
		pincode: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<PincodeDocument>("Pincode", PincodeSchema);
