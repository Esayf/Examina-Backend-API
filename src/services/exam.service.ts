import { ExamDocument } from "../types";
import Exam from "../models/exam.model";
import participatedUserService from "./participatedUser.service";
import answerService from "./answer.service";
import { checkExamTimes } from "../helpers/helperFunctions";

interface ExamResult {
	status: number;
	message: string;
}

async function create(examData: Partial<ExamDocument>): Promise<ExamDocument> {
	try {
		const exam = new Exam(examData);
		return await exam.save();
	} catch (error) {
		console.error("Error creating exam:", error);
		throw new Error("Error creating exam");
	}
}

async function getAllByUser(userId: string): Promise<ExamDocument[]> {
	try {
		return await Exam.find({ creator: userId });
	} catch (error) {
		console.error("Error fetching exams:", error);
		throw new Error("Error fetching exams");
	}
}

async function getById(examId: string): Promise<ExamDocument | null> {
	try {
		return await Exam.findById(examId);
	} catch (error) {
		console.error("Error fetching exam:", error);
		throw new Error("Error fetching exam");
	}
}

async function start(examId: string, userId: string): Promise<ExamResult> {
	try {
		const exam = await getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		const examTimeCheck = checkExamTimes(exam);
		if (!examTimeCheck.valid) {
			return {
				status: 400,
				message: examTimeCheck.message || "Invalid exam time",
			};
		}

		const participationResult = await participatedUserService.checkParticipation(userId, examId, {
			createIfNotExist: true,
		});

		return {
			status: participationResult.status,
			message: participationResult.message,
		};
	} catch (error) {
		console.error("Error starting exam:", error);
		throw new Error("Error starting exam");
	}
}

async function finish(userId: string, examId: string, answers: any[], walletAddress: string): Promise<ExamResult> {
	try {
		const exam = await getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		const participationResult = await participatedUserService.checkParticipation(userId, examId, {
			createIfNotExist: false,
		});

		if (!participationResult.success) {
			return {
				status: participationResult.status,
				message: participationResult.message,
			};
		}

		await answerService.create(userId, examId, answers, walletAddress);

		return { status: 200, message: "Exam completed successfully" };
	} catch (error) {
		console.error("Error finishing exam:", error);
		throw new Error("Error finishing exam");
	}
}

export default {
	create,
	getAllByUser,
	getById,
	start,
	finish,
};
