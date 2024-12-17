import Draft from "../models/draft.model";
import { DraftDocument } from "../types";

async function create(draftData: Partial<DraftDocument>): Promise<DraftDocument> {
	try {
		const draft = new Draft(draftData);
		return await draft.save();
	} catch (err) {
		console.error("Error creating draft: ", err);
		throw new Error("Failed to create draft");
	}
}

async function getAllByUser(userId: string): Promise<DraftDocument[]> {
	try {
		return await Draft.find({ creator: userId }).sort({ updatedAt: -1 });
	} catch (err) {
		console.error("Error fetching drafts for user: ", err);
		throw new Error("Failed to fetch drafts for user");
	}
}

async function getById(draftId: string): Promise<DraftDocument | null> {
	try {
		return await Draft.findById(draftId);
	} catch (err) {
		console.error("Error fetching draft by ID: ", err);
		throw new Error("Failed to fetch draft by ID");
	}
}

async function update(draftId: string, draftData: Partial<DraftDocument>): Promise<DraftDocument | null> {
	try {
		return await Draft.findByIdAndUpdate(draftId, draftData, { new: true });
	} catch (err) {
		console.error("Error updating draft: ", err);
		throw new Error("Failed to update draft");
	}
}

async function remove(draftId: string): Promise<boolean> {
	try {
		const result = await Draft.findByIdAndDelete(draftId);
		return !!result;
	} catch (err) {
		console.error("Error deleting draft: ", err);
		throw new Error("Failed to delete draft");
	}
}

export default {
	create,
	getAllByUser,
	getById,
	update,
	remove,
};
