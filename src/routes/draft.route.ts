import express from "express";
import draftController from "../controllers/draft.controller";
import { ensureAuthenticated } from "../middleware/middleware";

const router = express.Router();

router.use(ensureAuthenticated);

router.post("/", draftController.createDraft);
router.get("/", draftController.getAllDrafts);
router.get("/:id", draftController.getDraftById);
router.put("/:id", draftController.updateDraft);
router.delete("/:id", draftController.deleteDraft);

export default router;
