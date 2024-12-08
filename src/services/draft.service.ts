import Draft from "../models/draft.model";
import { DraftDocument } from "../types";

async function create(draftData: Partial<DraftDocument>): Promise<DraftDocument> {
	const draft = new Draft(draftData);
	return await draft.save();
}

async function getAllByUser(userId: string): Promise<DraftDocument[]> {
	return await Draft.find({ creator: userId }).sort({ updatedAt: -1 });
}

async function getById(draftId: string): Promise<DraftDocument | null> {
	return await Draft.findById(draftId);
}

async function update(draftId: string, draftData: Partial<DraftDocument>): Promise<DraftDocument | null> {
	return await Draft.findByIdAndUpdate(draftId, draftData, { new: true });
}

async function remove(draftId: string): Promise<boolean> {
	const result = await Draft.findByIdAndDelete(draftId);
	return !!result;
}

export default {
	create,
	getAllByUser,
	getById,
	update,
	remove,
};
