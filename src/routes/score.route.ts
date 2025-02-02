import express from "express";
import scoreController from "../controllers/score.controller";
import { ensureAuthenticated, ensureAdmin } from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { scoreSchemas } from "@/schemas/score.schema";

const router = express.Router();

router.use(ensureAuthenticated);

router.get("/allScores", ensureAdmin, scoreController.getAllScores);
router.get("/:examId", validateRequest({ params: scoreSchemas.params }), scoreController.getScoresByExamId);

export default router;
