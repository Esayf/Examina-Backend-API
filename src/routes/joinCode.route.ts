import express from "express";
import draftController from "../controllers/draft.controller";
import { ensureAuthenticated } from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { draftSchemas } from "../schemas/draft.schema";

const router = express.Router();

router.use(ensureAuthenticated);

router.post("/", draftController.createDraft);

export default router;
