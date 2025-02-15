import { Response } from "express";
import { CustomRequest, QuestionInput } from "@/typings";
import examService, { SortFields } from "../services/exam.service";
import participatedUserService from "@/services/participatedUser.service";
import User from "@/models/user.model";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/utils/errors";

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
	isWinnerlistRequested: boolean;
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
		console.error("Error creating exam: ", err);
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
			return res.status(403).json({ message: "Only creator can access" });
		}
		const generatedLinks = await examService.generateAndSendLinks(examId, emailList);
		return res.status(201).json({ success: true, result: generatedLinks });
	} catch (err) {
		console.error("Error generating links: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllExamsByUser(req: CustomRequest, res: Response) {
	try {
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const { role, filter, sortBy, sortOrder } = req.query;
		console.log("QUERY PARAMS: ", userId, role, filter, sortBy, sortOrder);
		const exams = await examService.getAllByUser(
			userId,
			role as string,
			filter as string,
			sortBy as SortFields,
			sortOrder as "asc" | "desc"
		);
		return res.status(200).json(exams);
	} catch (err) {
		console.error("Error fetching exams: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllCreatedExams(req: CustomRequest, res: Response) {
	try {
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const exams = await examService.getAllCreatedExams(userId);
		return res.status(200).json(exams);
	} catch (err) {
		console.error("Error fetching created exams: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllJoinedExams(req: CustomRequest, res: Response) {
	try {
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const exams = await examService.getAllJoinedExams(userId);
		return res.status(200).json(exams);
	} catch (err) {
		console.error("Error fetching joined exams: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getExamById(req: CustomRequest, res: Response) {
	try {
		const { id } = req.params;
		const exam = await examService.getById(id);
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}

		const participatedUser = await participatedUserService.get(userId, id);

		const response = { exam: exam, participatedUser: participatedUser };
		return res.status(200).json(response);
	} catch (err) {
		console.error("Error fetching exam: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getExamDetails(req: CustomRequest, res: Response) {
	try {
		const { id } = req.params;
		const examDetails = await examService.getDetails(id);

		if (!examDetails) {
			return res.status(404).json({ message: "Exam not found" });
		}

		if (examDetails?.creator != req.session.user?.userId) {
			return res.status(403).json({ message: "Only creator can access" });
		}

		const creatorWallet = (await User.findById(examDetails.creator))?.walletAddress;
		return res.status(200).json({
			...examDetails,
			creator: creatorWallet,
		});
	} catch (err) {
		console.error("Error fetching exam details: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function startExam(req: CustomRequest, res: Response) {
	try {
		const {
			examId,
			passcode = "",
			nickname = null,
		} = req.body as {
			examId: string;
			passcode?: string;
			nickname?: string;
		};
		const userId = req.session.user?.userId;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const { status, message } = await examService.start(examId, userId, passcode, nickname);
		return res.status(status).json({ message });
	} catch (err) {
		console.error("Error starting exam: ", err);
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
		console.error("Error finishing exam and submitting answers: ", err);
		return res.status(500).json({ message: "Error finishing exam and submitting answers" });
	}
}

/**
 * Update exam status
 * @route PATCH /exams/:id/status
 */
async function updateStatus(req: CustomRequest, res: Response) {
	try {
		const { id } = req.params;
		const { status } = req.body;
		const userId = req.session.user?.userId;

		if (!userId) {
			throw new BadRequestError("User ID not found in session");
		}

		const updatedExam = await examService.updateExamStatus(id, userId, status);

		return res.json({
			success: true,
			message: "Exam status updated successfully",
			data: {
				examId: updatedExam._id,
				status: updatedExam.status,
			},
		});
	} catch (error) {
		if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError) {
			return res.status(error.statusCode).json({
				success: false,
				message: error.message,
			});
		}

		console.error("Error updating exam status:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
}

export default {
	createExam,
	generateLinks,
	getAllExamsByUser,
	getAllCreatedExams,
	getAllJoinedExams,
	getExamById,
	getExamDetails,
	startExam,
	finishExam,
	updateStatus,
};
