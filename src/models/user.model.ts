import mongoose, { Schema } from "mongoose";
import { UserDocument } from "@/typings";

const UserSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
		},
		walletAddress: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<UserDocument>("User", UserSchema);
