import express from "express";
import scoreController from "../controllers/score.controller.js";
import { ensureAuthenticated } from "../middleware/middleware.js";
const router = express.Router();
router.get("/allScores", ensureAuthenticated, scoreController.getAllScores);
router.get("/:examId", ensureAuthenticated, scoreController.getScoresByExamId);
export default router;
