import Exam from "../models/exam.model";
import { ExamDocument, ExtendedExamDocument } from "@/typings";
import sendWinnerlistToCreator from "./sendWinnerlistToCreator";

async function checkCompletedExams() {
	try {
		console.log("Running check completed exams job");
		const now = new Date();
		const exams = await Exam.find({ isCompleted: false });

		if (!exams || exams.length === 0) {
			return;
		}

		const completedExams: ExamDocument[] = exams.filter((exam: ExamDocument) => {
			const startDate = new Date(exam.startDate);
			const endDate = new Date(startDate.getTime() + exam.duration * 60 * 1000);
			console.log(`Exam: ${exam.title}, EndDate: ${endDate}, Now: ${now}`);
			return endDate <= now;
		});

		console.log("Completed Exams: ", completedExams);

		if (completedExams.length === 0) {
			console.log("No completed exams found.");
		} else {
			await Exam.updateMany(
				{ _id: { $in: completedExams.map((exam) => exam._id) } },
				{ $set: { isCompleted: true } }
			);
		}

		const winnerlistRequestedExams: ExamDocument[] = completedExams.filter((exam: ExamDocument) => {
			return exam.isWinnerlistRequested;
		});

		await sendWinnerlistToCreator(winnerlistRequestedExams as ExtendedExamDocument[]);
	} catch (error) {
		console.error("Error publishing exam answers: ", error);
	}
}

// Schedule the job to run every 2 minutes using Bun's scheduler
setInterval(checkCompletedExams, 1 * 60 * 1000);

export default checkCompletedExams;
