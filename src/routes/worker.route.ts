import express from "express";
import {
	initWinnerMap,
	addWinner,
	payoutWinners,
	calculateScore,
	initWinnerMapAddTwoWinnersAndPayout,
} from "../controllers/worker.controller";
import { ensureAuthenticated } from "../middleware/middleware";

const router = express.Router();

router.post("/initWinnerMap", initWinnerMap);
router.post("/addWinner", addWinner);
router.post("/payoutWinners", payoutWinners);
router.post("/calculateScore", calculateScore);
router.post("/initWinnerMapAddTwoWinnersAndPayout", initWinnerMapAddTwoWinnersAndPayout);

export default router;
