import { PrivateKey, PublicKey, Mina, UInt64, AccountUpdate } from "o1js";
import dotenv from "dotenv";

dotenv.config();

const devnetTestnet = Mina.Network("https://api.minascan.io/node/devnet/v1/graphql");
Mina.setActiveInstance(devnetTestnet);

const adminPrivateKey = PrivateKey.fromBase58(process.env.ADMIN_PRIVATE_KEY || "");
const adminPublicKey = adminPrivateKey.toPublicKey();

/**
 * @param {Array<string>} winners - Addresses of winners
 * @param {number} amount - Reward amount in nanomina
 */
export const distributeRewards = async (winners: string[], amount: number) => {
	const txs = [];
	const nanominaAmount = amount * 1_000_000_000; // convert to nanomina

	for (const winner of winners) {
		try {
			const recipient = PublicKey.fromBase58(winner);

			const tx = await Mina.transaction(
				{ sender: adminPublicKey, fee: UInt64.from(10_150_000) }, // Fee = 0.01 MINA
				async () => {
					const update = AccountUpdate.createSigned(adminPublicKey);
					update.send({
						to: recipient,
						amount: UInt64.from(nanominaAmount), // Reward amount in nanomina
					});
				}
			);

			tx.sign([adminPrivateKey]);

			const transactionId = await tx.send();
			txs.push({ address: winner, transactionId: transactionId.hash });

			console.log(`Reward sent: ${winner}, Tx Id: ${transactionId.hash}`);
		} catch (error) {
			console.error(`Error: reward was not sent for ${winner} .`, error);
		}
	}

	return txs;
};
