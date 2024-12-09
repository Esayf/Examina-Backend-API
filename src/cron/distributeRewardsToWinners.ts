import { distributeRewardsWithWorker } from "../wallet";
import Exam from "../models/exam.model";
import ParticipatedUser from "../models/participatedUser.model";
import { ParticipatedUserWithPopulatedUser } from "@/types/participatedUser";

async function distributeRewardsToWinners() {
	// Every 1 minute
	console.log(`[${new Date().toISOString()}] Reward distribution cronjob is running.`);
	try {
		const finishedExams = await Exam.find({ isCompleted: true, isRewarded: true, isDistributed: false });

		for (const exam of finishedExams) {
			console.log(`Exam is being processed: ${exam.id}`);

			try {
				const participatedWinners = await ParticipatedUser.aggregate<ParticipatedUserWithPopulatedUser>([
					{
						$match: {
							isFinished: true,
							isWinner: true,
							isRewardSent: false,
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
							"user.walletAddress": { $ne: null },
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
				]);
				console.log("Participated Winners: ", participatedWinners);
				if (!participatedWinners) {
					console.log(`Winner(s) not found for ${exam.id}`);
					return;
				}
				if (participatedWinners.length == 0) return;
				exam.isDistributed = true;
				await exam.save();

				// Reward distribution
				const results = await distributeRewardsWithWorker(
					exam.contractAddress,
					exam.rewardPerWinner,
					participatedWinners
				);
				console.log(`Rewards were distributed successfully for ${exam.id}`, results);
			} catch (error) {
				exam.isDistributed = false;
				await exam.save();
				console.error(`Error when distributing rewards ${exam.id}`, error);
			}
		}
	} catch (error) {
		console.error("Error scheduling job:", error);
	}
}

// Schedule the job to run every 1 minute
setInterval(distributeRewardsToWinners, 60000);

export default distributeRewardsToWinners;
