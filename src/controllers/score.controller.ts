import { Request, Response } from "express";
import scoreService from "../services/score.service.js";

async function getAllScores(req: Request, res: Response) {
	try {
		const scores = await scoreService.getAll();
		if (!scores) {
			return res.status(404).json({ message: "Scores not found" });
		}
		return res.status(200).json(scores);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getScoresByExamId(req: Request, res: Response) {
	try {
		const { examId } = req.params;
		const scores = await scoreService.getScoresByExamId(examId);
		if (!scores) {
			return res.status(404).json({ message: "Scores not found" });
		}
		return res.status(200).json(scores);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export default {
	getAllScores,
	getScoresByExamId,
};
