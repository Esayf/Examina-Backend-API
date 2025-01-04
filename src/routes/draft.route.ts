import express from "express";
import draftController from "../controllers/draft.controller";
import { ensureAuthenticated } from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { draftSchemas } from "../schemas/draft.schema";

// TODO: TECH DEBT ZOD IMPLEMENTATION FOR ALL ROUTES

const router = express.Router();

router.use(ensureAuthenticated);

// Create draft
router.post(
	"/",
	validateRequest({
		body: draftSchemas.createDraft,
	}),
	draftController.createDraft
);

// Get all drafts with optional pagination and sorting
router.get(
	"/",
	validateRequest({
		query: draftSchemas.query,
	}),
	draftController.getAllDrafts
);

// Get draft by ID
router.get(
	"/:id",
	validateRequest({
		params: draftSchemas.params,
	}),
	draftController.getDraftById
);

// Update draft
router.put(
	"/:id",
	validateRequest({
		params: draftSchemas.params,
		body: draftSchemas.updateDraft,
	}),
	draftController.updateDraft
);

// Delete draft
router.delete(
	"/:id",
	validateRequest({
		params: draftSchemas.params,
	}),
	draftController.deleteDraft
);

export default router;
