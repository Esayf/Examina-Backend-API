import cron from "node-cron";
import { distributeRewards } from "../wallet";
import Exam from "../models/exam.model";
import ParticipatedUser from "../models/participatedUser.model";
import User from "../models/user.model";

async function distributeRewardsToWinners() {
	// Every 1 minute
	cron.schedule("* * * * *", async () => {
		console.log(`[${new Date().toISOString()}] Ödül dağıtım cronjob'u çalıştı.`);

		try {
			const finishedExams = await Exam.find({ isCompleted: true, isDistributed: false });

			for (const exam of finishedExams) {
				console.log(`Sınav işleniyor: ${exam.id}`);

				try {
					const winners = await ParticipatedUser.find({ exam: exam.id, isWinner: true });

					if (!winners) {
						console.log(`Winner(s) not found for ${exam.id}`);
						return;
					}

					const winnerAddresses: string[] = [];
					for (const winner of winners) {
						const user = await User.findById(winner.user);

						if (!user || !user.walletAddress) {
							console.warn(`Wallet address not found for ${winner.user}`);
							continue;
						}

						winnerAddresses.push(user.walletAddress);
					}

					const amount = exam.rewardPerWinner;

					// Reward distribution
					const results = await distributeRewards(winnerAddresses, amount);

					console.log(`Rewards were distributed successfully for ${exam.id}`, results);

					exam.isDistributed = true;
					await exam.save();
				} catch (error) {
					console.error(`Error when distributing rewards ${exam.id}`, error);
				}
			}
		} catch (error) {
			console.error("Error scheduling job:", error);
		}
	});
}

export default distributeRewardsToWinners;
