import Queue from "bull";
import { ParticipatedUserWithPopulatedUser } from "../types/participatedUser";
import { sendExamResultEmail } from "../mailer";
import redisClient from "../config/redis";
import ParticipatedUser from "../models/participatedUser.model";
import Score from "../models/score.model";
import { ScoreDocument } from "@/types";

const examResultsQueue = new Queue("examResults", {
	redis: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
	},
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Job processing
examResultsQueue.process(1, async (job) => {
	try {
		const participated = job.data.participated as ParticipatedUserWithPopulatedUser;

		// Find the participated user in the database
		const participatedUser = await ParticipatedUser.findById(participated._id);
		console.log("Processing job for participated user:", participatedUser);
		console.log("Participated user id:", participated?._id);

		if (!participatedUser) return;

		if (!participated.user?.email) {
			console.log("User does not have an email.");
			return;
		}

		if (!participated.exam?.isCompleted) {
			console.log("Exam is not completed yet.");
			return;
		}

		if (participatedUser.isMailSent) {
			console.log("Mail has already been sent to the user.");
			return;
		}

		let score = await Score.findOne({
			exam: participated.exam._id,
			user: participated.user._id,
		});

		if (!score) {
			console.log("User score not found.");
			return;
		}

		// Determine if user is a winner and get reward amount
		const isWinner = participated.isWinner;
		const rewardAmount = isWinner ? participated.exam.rewardPerWinner : undefined;

		await sendExamResultEmail(
			participated.user.email,
			participated.exam.title,
			participated.exam.questionCount,
			score.correctAnswers,
			isWinner,
			rewardAmount
		);

		participatedUser.isMailSent = true;
		await participatedUser.save();

		return { success: true };
	} catch (error) {
		console.error("Error processing exam results:", error);
		throw error;
	}
});

export default examResultsQueue;
