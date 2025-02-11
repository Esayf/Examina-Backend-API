import mongoose, { Schema } from "mongoose";
import { JoinCode } from "@/typings";

const JoinCodeSchema = new Schema(
	{
		exam: {
			type: Schema.Types.ObjectId,
			ref: "Exam",
			required: true,
		},
		joinCode: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<JoinCode>("JoinCode", JoinCodeSchema);
