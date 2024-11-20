import ParticipatedUser from "../models/participatedUser.model.js";
import examResultsQueue from "../queues/examResultsQueue.js";
import { ParticipatedUserWithPopulatedUser } from "../types/participatedUser";

async function checkParticipantScoreAndMail() {
	try {
		const participated = await ParticipatedUser.aggregate<ParticipatedUserWithPopulatedUser>([
			{
				$match: {
					isMailSent: false,
					isFinished: true,
					jobAdded: false,
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "user",
					foreignField: "_id",
					as: "user",
				},
			},
			{
				$unwind: "$user",
			},
			{
				$match: {
					"user.email": { $ne: null },
				},
			},
			{
				$lookup: {
					from: "exams",
					localField: "exam",
					foreignField: "_id",
					as: "exam",
				},
			},
			{
				$unwind: "$exam",
			},
			{
				$match: {
					"exam.isCompleted": true,
				},
			},
			{
				$limit: 1,
			},
		]);

		if (!participated || participated.length === 0) {
			return;
		}

		const participatedUser = participated[0];

		await examResultsQueue.add({ participated: participatedUser });
		console.log("Participated user added to the queue");

		await ParticipatedUser.updateOne({ _id: participatedUser._id }, { $set: { jobAdded: true } });
	} catch (error) {
		console.error("Error scheduling job: ", error);
	}
}

// Schedule the job to run every 3 seconds using Bun's scheduler
setInterval(checkParticipantScoreAndMail, 3000);

export default checkParticipantScoreAndMail;
