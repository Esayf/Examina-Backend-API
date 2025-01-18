import { Response } from "express";
import { CustomRequest } from "@/typings";
import scoreService from "../services/score.service";

async function getAllScores(req: CustomRequest, res: Response) {
	try {
		const scores = await scoreService.getAll();
		if (!scores) {
			return res.status(404).json({ message: "Scores not found" });
		}
		return res.status(200).json(scores);
	} catch (err) {
		console.error("Error fetching scores: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getScoresByExamId(req: CustomRequest, res: Response) {
	try {
		const { examId } = req.params;
		const scores = await scoreService.getScoresByExamId(examId);
		if (!scores) {
			return res.status(404).json({ message: "Scores not found" });
		}
		return res.status(200).json(scores);
	} catch (err) {
		console.error("Error fetching scores of the exam: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export default {
	getAllScores,
	getScoresByExamId,
};
