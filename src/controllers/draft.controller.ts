import { Response } from "express";
import { CustomRequest } from "../types";
import draftService from "../services/draft.service";

async function createDraft(req: CustomRequest, res: Response) {
	try {
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const draftData = {
			...req.body,
			creator: userId,
		};

		const draft = await draftService.create(draftData);
		return res.status(201).json(draft);
	} catch (err) {
		console.error("Error creating draft:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllDrafts(req: CustomRequest, res: Response) {
	try {
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const drafts = await draftService.getAllByUser(userId);
		return res.status(200).json(drafts);
	} catch (err) {
		console.error("Error fetching drafts:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getDraftById(req: CustomRequest, res: Response) {
	try {
		const { id } = req.params;
		const userId = req.session.user?.userId;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const draft = await draftService.getById(id);

		if (!draft) {
			return res.status(404).json({ message: "Draft not found" });
		}

		if (draft.creator.toString() !== userId) {
			return res.status(403).json({ message: "Forbidden" });
		}

		return res.status(200).json(draft);
	} catch (err) {
		console.error("Error fetching draft:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function updateDraft(req: CustomRequest, res: Response) {
	try {
		const { id } = req.params;
		const userId = req.session.user?.userId;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const draft = await draftService.getById(id);

		if (!draft) {
			return res.status(404).json({ message: "Draft not found" });
		}

		if (draft.creator.toString() !== userId) {
			return res.status(403).json({ message: "Forbidden" });
		}

		const updatedDraft = await draftService.update(id, req.body);
		return res.status(200).json(updatedDraft);
	} catch (err) {
		console.error("Error updating draft:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function deleteDraft(req: CustomRequest, res: Response) {
	try {
		const { id } = req.params;
		const userId = req.session.user?.userId;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const draft = await draftService.getById(id);

		if (!draft) {
			return res.status(404).json({ message: "Draft not found" });
		}

		if (draft.creator.toString() !== userId) {
			return res.status(403).json({ message: "Forbidden" });
		}

		await draftService.remove(id);
		return res.status(200).json({ message: "Draft deleted successfully" });
	} catch (err) {
		console.error("Error deleting draft:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export default {
	createDraft,
	getAllDrafts,
	getDraftById,
	updateDraft,
	deleteDraft,
};
