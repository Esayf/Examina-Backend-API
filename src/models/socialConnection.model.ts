import mongoose, { Schema } from "mongoose";
import { SocialConnectionDocument } from "../types";

const SocialConnectionSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		platform: {
			type: String,
			enum: ["twitter", "discord"],
			required: true,
		},
		accountId: {
			type: String,
			required: true,
		},
		displayName: {
			type: String,
		},
		accessToken: {
			type: String,
			required: true,
		},
		refreshToken: {
			type: String,
		},
		expiresAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
		indexes: [
			// Compound index to ensure one platform connection per user
			{ user: 1, platform: 1, unique: true },
			// Index for quick lookups by accountId
			{ accountId: 1 },
		],
	}
);

// Add a method to check if token needs refresh
SocialConnectionSchema.methods.needsRefresh = function (): boolean {
	if (!this.expiresAt) return false;
	// Return true if token expires in less than 5 minutes
	return this.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
};

export default mongoose.model<SocialConnectionDocument>("SocialConnection", SocialConnectionSchema);
