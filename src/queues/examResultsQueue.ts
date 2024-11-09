import Queue from "bull";
import { ParticipatedUserWithPopulatedUser } from "../types/participatedUser";
import { sendExamResultEmail } from "../mailer";
import redisClient from "../config/redis";

const examResultsQueue = new Queue("examResults", {
	redis: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
	},
});

examResultsQueue.process(async (job) => {
	try {
		const participated = job.data.participated as ParticipatedUserWithPopulatedUser;
		await sendExamResultEmail(participated);

		// Update participation status
		participated.isMailSent = true;
		await participated.save();

		return { success: true };
	} catch (error) {
		console.error("Error processing exam results:", error);
		throw error;
	}
});

export default examResultsQueue;
