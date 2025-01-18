import { Response } from "express";
import { CustomRequest } from "@/typings";
import questionService from "../services/question.service";

async function getQuestionById(req: CustomRequest, res: Response) {
	const { questionId } = req.params;

	try {
		const question = await questionService.getById(questionId);
		if (!question) {
			return res.status(404).json({ message: "Question not found" });
		}

		return res.status(200).json(question);
	} catch (error) {
		console.error("Error fetching question: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getQuestionsByExam(req: CustomRequest, res: Response) {
	const userId = req.session.user?.userId;
	const { examId } = req.params;

	if (!userId) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const response = await questionService.getAllByExam(examId, userId);
		return res.status(response.status).json(response.data || { message: response.message });
	} catch (err) {
		console.error("Error fetching questions: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export default {
	getQuestionById,
	getQuestionsByExam,
};
