import Exam from "../models/exam.model";
import { ExamDocument } from "../types";

async function checkCompletedExams() {
	try {
		console.log("Running check completed exams job");
		const now = new Date();
		const exams = await Exam.find({ isCompleted: false });

		if (!exams || exams.length === 0) {
			return;
		}

		const completedExams = exams.filter((exam: ExamDocument) => {
			const startDate = new Date(exam.startDate);
			const endDate = new Date(startDate.getTime() + exam.duration * 60 * 1000);
			console.log(`Exam: ${exam.title}, EndDate: ${endDate}, Now: ${now}`);
			return endDate <= now;
		});

		console.log("Completed Exams: ", completedExams);

		if (completedExams.length === 0) {
			console.log("No completed exams found.");
		} else {
			for (const exam of completedExams) {
				await new Promise((resolve) => setTimeout(resolve, 500));
				console.log("Delayed for 1/2 second.");

				exam.isCompleted = true;
				await exam.save();
			}
		}
	} catch (error) {
		console.error("Error publishing exam answers: ", error);
	}
}

// Schedule the job to run every 2 minutes using Bun's scheduler
setInterval(checkCompletedExams, 1 * 60 * 1000);

export default checkCompletedExams;
