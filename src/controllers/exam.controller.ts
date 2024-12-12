import { Response } from "express";
import { CustomRequest, QuestionInput } from "../types";
import examService from "../services/exam.service";
import participatedUserService from "@/services/participatedUser.service";

interface ExamInput {
	title: string;
	description: string;
	startDate: string;
	duration: number;
	rootHash: string;
	secretKey: string;
	questionCount: number;
	contractAddress: string;
	deployJobId: string;
	passingScore: number;
	isRewarded: boolean;
	rewardPerWinner: number;
	isPrivate: boolean;
}

async function createExam(req: CustomRequest, res: Response) {
	try {
		const examData = req.body as ExamInput;
		const userId = req.session.user?.userId;
		const questions = req.body.questions as Array<QuestionInput>;

		const exam = await examService.create(
			{
				...examData,
				creator: userId,
				startDate: new Date(examData.startDate),
			},
			questions
		);

		return res.status(201).json(exam);
	} catch (err) {
		console.error("Error creating exam:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function generateLinks(req: CustomRequest, res: Response) {
	try {
		const { examId, emailList } = req.body;

		if (!examId || !emailList || !Array.isArray(emailList)) {
			return res.status(400).json({ message: "Invalid input" });
		}
		const exam = await examService.getById(examId);
		if (exam?.creator != req.session.user?.userId) {
			return res.status(401).json({ message: "Only creator can access!" });
		}
		const generatedLinks = await examService.generateAndSendLinks(examId, emailList);
		return res.status(201).json({ success: true, result: generatedLinks });
	} catch (err) {
		console.error("Error generating links:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllExams(req: CustomRequest, res: Response) {
	try {
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const exams = await examService.getAllByUser(userId);
		return res.status(200).json(exams);
	} catch (err) {
		console.error("Error fetching exams:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getExamById(req: CustomRequest, res: Response) {
	try {
		const { id } = req.params;
		const exam = await examService.getById(id);
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(404).json({ message: "User not found" });
		}
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}

		const participatedUser = await participatedUserService.get(userId, id);

		const response = { exam: exam, participatedUser: participatedUser };
		return res.status(200).json(response);
	} catch (err) {
		console.error("Error fetching exam:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function startExam(req: CustomRequest, res: Response) {
	try {
		const { examId, passcode, nickname } = req.body as {
			examId: string;
			passcode: string;
			nickname: string | null;
		};
		const userId = req.session.user?.userId;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const { status, message } = await examService.start(examId, userId, passcode, nickname);
		return res.status(status).json({ message });
	} catch (err) {
		console.error("Error starting exam:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}

interface FinishExamInput {
	examId: string;
	answers: Array<{
		questionId: string;
		answer: any;
	}>;
}

async function finishExam(req: CustomRequest, res: Response) {
	try {
		const { examId, answers } = req.body as FinishExamInput;
		const userId = req.session.user?.userId;
		const walletAddress = req.session.user?.walletAddress;

		if (!userId || !walletAddress) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const result = await examService.finish(userId, examId, answers, walletAddress);
		return res.status(result.status).json({ message: result.message });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Error finishing exam and submitting answers" });
	}
}

export default {
	createExam,
	generateLinks,
	getAllExams,
	getExamById,
	startExam,
	finishExam,
};
