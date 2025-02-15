import { PrivateKey, PublicKey, Mina, UInt64, AccountUpdate, fetchAccount } from "o1js";
import dotenv from "dotenv";
import axios from "axios";
import { formatMina, parseMina } from "./helpers/helperFunctions";
import {
	Winner,
	addOneWinnerAndPayout,
	addWinnersAndPayout,
	initWinnerMapAddOneWinnerAndPayout,
	initWinnerMapAddTwoWinnersAndPayout,
} from "./zkcloudworker/workerAPI";
import { ParticipatedUserDocument } from "@/typings";
import User from "@/models/user.model";
import participatedUserService from "@/services/participatedUser.service";
dotenv.config();

const devnetTestnet = Mina.Network("https://api.minascan.io/node/devnet/v1/graphql");
Mina.setActiveInstance(devnetTestnet);

const adminPrivateKey = PrivateKey.fromBase58(process.env.ADMIN_PRIVATE_KEY || "");
const adminPublicKey = adminPrivateKey.toPublicKey();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch the current nonce for the admin account
 */
const getAdminNonce = async () => {
	try {
		const account = await fetchAccount({ publicKey: adminPublicKey });
		return account.account?.nonce?.toBigint() || BigInt(0);
	} catch (error) {
		console.error("Error fetching admin account info:", error);
		throw error;
	}
};

/**
 * Check transaction status using GraphQL API
 * @param {string} transactionId - Transaction ID to check
 */
const checkTransactionStatus = async (transactionId: string) => {
	const query = `
	query ($hash: String!) {
		transactions(query: { hash: $hash }) {
			hash
			status
			failureReason
		}
	}
`;

	try {
		const response = await axios.post("https://api.minascan.io/node/devnet/v1/graphql", {
			query,
			variables: { hash: transactionId },
		});
		const data = response.data;
		if (data && data.status === "applied") {
			return true;
		}
		return false;
	} catch (error) {
		console.error(`Error checking transaction status for ${transactionId}:`, error);
		return false;
	}
};

/**
 * Distribute rewards with the worker
 * @param {Winner[]} winners - Winners
 */
export const distributeRewardsWithWorker = async (
	contractAddress: string,
	rewardPerWinner: number,
	participatedWinners: ParticipatedUserDocument[]
) => {
	try {
		const winners: Winner[] = [];
		console.log("Distribution starts: ");
		for (const winner of participatedWinners) {
			const user = await User.findById(winner.user);
			if (!user || !user.walletAddress) {
				console.warn(`Wallet address not found for ${winner.user}`);
				continue;
			}
			winners.push({
				publicKey: user.walletAddress,
				reward: rewardPerWinner.toString(),
			});
		}

		console.log("Winners: ", winners);
		if (winners.length == 1) {
			const initMapAndPayoutResult = await initWinnerMapAddOneWinnerAndPayout(
				JSON.stringify({
					contractAddress,
					winner: winners[0],
				})
			);
			await participatedUserService.updateParticipatedUserRewardStatusByWalletAndContractAddress(
				winners[0].publicKey,
				contractAddress,
				true,
				formatMina(winners[0].reward),
				new Date()
			);
			return initMapAndPayoutResult;
		} else {
			const initWinnerMapResult = await initWinnerMapAddTwoWinnersAndPayout(
				JSON.stringify({
					contractAddress,
					winner1: winners[0],
					winner2: winners[1],
				})
			);
			let previousProof = initWinnerMapResult.proof;
			let auxiliaryOutput = initWinnerMapResult.auxiliaryOutput;

			if (winners.length > 2) {
				// Every two winners we will call the worker
				for (let i = 2; i < winners.length; i += 2) {
					if (winners.length % 2 != 0 && i + 1 == winners.length) {
						const addOneWinnerAndPayoutResult = await addOneWinnerAndPayout({
							contractAddress,
							previousProof,
							serializedStringPreviousMap: auxiliaryOutput,
							winner: winners[i],
						});
						break;
					}
					const winner1 = winners[i];
					const winner2 = winners[i + 1];

					const payoutResult = await addWinnersAndPayout({
						contractAddress,
						previousProof,
						serializedStringPreviousMap: auxiliaryOutput,
						winner1,
						winner2,
					});
					if (payoutResult.isError) {
						console.error(
							"There was an error while distributing rewards to these winners: ",
							winner1,
							winner2
						);
						await participatedUserService.updateParticipatedUserRewardStatusByWalletAndContractAddress(
							winner1.publicKey,
							contractAddress,
							false,
							null,
							null
						);
						await participatedUserService.updateParticipatedUserRewardStatusByWalletAndContractAddress(
							winner2.publicKey,
							contractAddress,
							false,
							null,
							null
						);
						continue;
					} else {
						await participatedUserService.updateParticipatedUserRewardStatusByWalletAndContractAddress(
							winner1.publicKey,
							contractAddress,
							true,
							formatMina(winner1.reward),
							new Date()
						);
						await participatedUserService.updateParticipatedUserRewardStatusByWalletAndContractAddress(
							winner2.publicKey,
							contractAddress,
							true,
							formatMina(winner2.reward),
							new Date()
						);
					}
					previousProof = payoutResult.proof;
					auxiliaryOutput = payoutResult.auxiliaryOutput;
				}
			}
		}
	} catch (error) {
		console.error("Error distributing rewards:", error);
		throw error;
	}
};
/**
 * @param {Array<string>} winners - Addresses of winners
 * @param {number} amount - Reward amount in nanomina
 */
export const distributeManualRewards = async (winners: string[], amount: number) => {
	const txs: any = [];
	const nanominaAmount = parseMina(amount); // convert to nanomina
	let nonce: any = await getAdminNonce(); // Fetch the initial nonce

	for (const winner of winners) {
		try {
			const recipient = PublicKey.fromBase58(winner);

			const tx = await Mina.transaction(
				{ sender: adminPublicKey, fee: 10_150_000, nonce: nonce }, // Use incrementing nonce
				async () => {
					const update = AccountUpdate.createSigned(adminPublicKey);
					update.send({
						to: recipient,
						amount: UInt64.from(nanominaAmount), // Reward amount in nanomina
					});
				}
			);
			await tx.prove();
			tx.sign([adminPrivateKey]);

			const transactionId = await tx.send();
			await transactionId.wait();
			txs.push({ address: winner, transactionId: transactionId.hash });

			console.log(`Reward sent: ${winner}, Tx Id: ${transactionId.hash}`);

			// // İşlemin tamamlanmasını bekleyin
			// let confirmed = false;
			// let retries = 0;
			// while (!confirmed && retries < 20) {
			// 	await sleep(5_000); // 15 saniye bekleme
			// 	confirmed = await checkTransactionStatus(transactionId.hash);
			// 	retries++;
			// }

			// if (!confirmed) {
			// 	console.error(`Transaction ${transactionId.hash} could not be confirmed after retries.`);
			// }

			// // Increment nonce for the next transaction
			nonce++;
			// Her işlemden sonra 3 dakika bekle
			console.log("Waiting 3 minutes before sending the next transaction...");
			await sleep(3 * 60 * 1000); // 3 dakika bekleme
		} catch (error) {
			console.error(`Error: reward was not sent for ${winner}.`, error);
		}
	}

	return txs;
};
