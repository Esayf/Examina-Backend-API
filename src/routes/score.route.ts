import express from "express";
import scoreController from "../controllers/score.controller";
import { ensureAuthenticated, ensureAdmin } from "../middleware/middleware";

const router = express.Router();

router.get("/allScores", ensureAuthenticated, ensureAdmin, scoreController.getAllScores);
router.get("/:examId", ensureAuthenticated, scoreController.getScoresByExamId);

export default router;
