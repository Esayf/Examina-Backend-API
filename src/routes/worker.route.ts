import express from "express";
import {
	initWinnerMap,
	addWinner,
	payoutWinners,
	calculateScore,
	initWinnerMapAddTwoWinnersAndPayout,
} from "../controllers/worker.controller";
import { ensureAdmin, ensureAuthenticated } from "../middleware/middleware";

const router = express.Router();

router.post("/initWinnerMap", ensureAdmin, initWinnerMap);
router.post("/addWinner", ensureAdmin, addWinner);
router.post("/payoutWinners", ensureAdmin, payoutWinners);
router.post("/calculateScore", ensureAdmin, calculateScore);
router.post("/initWinnerMapAddTwoWinnersAndPayout", ensureAdmin, initWinnerMapAddTwoWinnersAndPayout);

export default router;
