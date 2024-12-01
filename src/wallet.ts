import { PrivateKey, PublicKey, Mina, UInt64, AccountUpdate, fetchAccount } from "o1js";
import dotenv from "dotenv";
import axios from "axios";

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

		console.log("Burası da neresi: ", response);

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
 * @param {Array<string>} winners - Addresses of winners
 * @param {number} amount - Reward amount in nanomina
 */
export const distributeRewards = async (winners: string[], amount: number) => {
	const txs: any = [];
	const nanominaAmount = amount * 2_000_000_000; // convert to nanomina
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
