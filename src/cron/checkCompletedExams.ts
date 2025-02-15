import Exam from "../models/exam.model";
import { ExamDocument, ExtendedExamDocument } from "@/typings";
import sendWinnerlistToCreator from "./sendWinnerlistToCreator";
import { ExamSessionService } from "../services/examSession.service";
import { Types } from "mongoose";

const examSessionService = new ExamSessionService();

async function checkCompletedExams() {
	try {
		console.log("Running check completed exams job");
		const now = new Date();

		// Handle regular (non-flexible) exams
		const regularExams = await Exam.find({
			isCompleted: false,
			$or: [{ isFlexible: false }, { isFlexible: { $exists: false } }],
		});

		if (regularExams && regularExams.length > 0) {
			const completedRegularExams: ExamDocument[] = regularExams.filter((exam: ExamDocument) => {
				const startDate = new Date(exam.startDate);
				const endDate = new Date(startDate.getTime() + exam.duration * 60 * 1000);
				console.log(`Regular Exam: ${exam.title}, EndDate: ${endDate}, Now: ${now}`);
				return endDate <= now;
			});

			if (completedRegularExams.length > 0) {
				await Exam.updateMany(
					{ _id: { $in: completedRegularExams.map((exam) => exam._id) } },
					{ $set: { isCompleted: true } }
				);

				// Handle winnerlist requests for regular exams
				const winnerlistRequestedExams: ExamDocument[] = completedRegularExams.filter(
					(exam: ExamDocument) => exam.isWinnerlistRequested
				);
				await sendWinnerlistToCreator(winnerlistRequestedExams as ExtendedExamDocument[]);
			}
		}

		// Handle flexible exams
		const flexibleExams = (await Exam.find({
			isCompleted: false,
			isFlexible: true,
			status: "active",
		})) as (ExamDocument & { _id: Types.ObjectId })[];

		if (flexibleExams && flexibleExams.length > 0) {
			for (const exam of flexibleExams) {
				// Get all active sessions for this exam
				const activeSessions = await examSessionService.getExamActiveSessions(exam._id.toString());

				// Check if all sessions are completed
				const hasActiveSessions = activeSessions.length > 0;

				// If no active sessions and exam is active, mark it as completed
				if (!hasActiveSessions) {
					exam.status = "completed";
					exam.isCompleted = true;
					await exam.save();

					// Handle winnerlist if requested
					if (exam.isWinnerlistRequested) {
						await sendWinnerlistToCreator([exam] as ExtendedExamDocument[]);
					}
				}
			}
		}

		// Clean up expired sessions
		await examSessionService.cleanupExpiredSessions();
	} catch (error) {
		console.error("Error checking completed exams: ", error);
	}
}

// Schedule the job to run every minute
setInterval(checkCompletedExams, 1 * 60 * 1000);

export default checkCompletedExams;
