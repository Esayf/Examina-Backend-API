const cron = require("node-cron");
const Exam = require("../models/exam.model");

const { setTimeout } = require("timers");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

cron.schedule("*/2 * * * *", async () => {
	try {
		console.log("Running cron job");
		const now = new Date();
		const exams = await Exam.find({ isCompleted: false });
		if (!exams || exams.length === 0) {
			console.log("No exams found in cron job.");
			return;
		}
		const completedExams = exams.filter((exam) => {
			const startDate = new Date(exam.startDate);
			const endDate = new Date(
				startDate.getTime() + exam.duration * 60 * 1000
			);
			console.log(
				`Sinav: ${exam.title}, EndDate: ${endDate}, Now: ${now}`
			);
			return endDate <= now;
		});
		console.log("Completed Exams: ", completedExams);
		if (completedExams.length == 0) {
			console.log("No completed exams found.");
		} else {
			for (const exam of completedExams) {
				await delay(500);
				console.log("Delayed for 1/2 second.");

				exam.isCompleted = true;
				await exam.save();
			}
		}
	} catch (error) {
		console.error("Error publishing exam answers: ", error);
	}
});
