import crypto from "crypto";
import { ExamDocument, Answer, ProcessedAnswer } from "@/typings";
import axios from "axios";
import Client from "mina-signer";
import { v4 as uuidv4 } from "uuid";

const signerClient = new Client({ network: "testnet" });
const mainnetSignerClient = new Client({ network: "mainnet" });
export function generateAnswerArray(answers: Answer[], walletAddress: string): ProcessedAnswer[] {
	return answers.map((answer) => {
		const hashInput = walletAddress + JSON.stringify(answer.answer);
		const answerHash = crypto.createHash("sha256").update(hashInput).digest("hex");
		return {
			question: answer.questionId,
			selectedOption: answer.answer,
			answerHash: answerHash,
		};
	});
}

type VerifyBody = {
	data: string;
	publicKey: string;
	signature: any; // Eğer signature'ın kesin bir tipi varsa (örneğin `string` veya `object`), burayı güncelleyebilirsiniz
};

export default function verifySignature(
	message: string | object,
	walletAddress: string,
	signature: string | object
): boolean {
	const parsedMessage = typeof message === "string" ? message : JSON.stringify(message);

	// console.log("Raw Signature: ", signature);

	const parsedSignature = typeof signature === "string" ? JSON.parse(signature) : signature;

	const verifyBody: VerifyBody = {
		data: parsedMessage,
		publicKey: walletAddress,
		signature: parsedSignature,
	};

	// console.log("wallet address: ", verifyBody.publicKey);
	console.log("Data: ", verifyBody.data);
	console.log("Parsed Signature: ", verifyBody.signature);

	const verifyResult = signerClient.verifyMessage(verifyBody);
	const mainnetVerifyResult = mainnetSignerClient.verifyMessage(verifyBody);
	console.log("Result: ", verifyResult);
	console.log("Mainnet Result: ", mainnetVerifyResult);

	return verifyResult || mainnetVerifyResult;
}

async function pinToIPFS(hash: string): Promise<string> {
	try {
		const response = await axios.post(
			"https://api.pinata.cloud/pinning/pinByHash",
			{
				hashToPin: hash,
				pinataMetadata: {
					name: "Pinned_Link",
				},
			},
			{
				headers: {
					pinata_api_key: process.env.PINATA_API_KEY as string,
					pinata_secret_api_key: process.env.PINATA_SECRET_KEY as string,
				},
			}
		);
		console.log("SUCCESS: Pinned CID:", hash);
		return response.data.IpfsHash;
	} catch (error) {
		console.error("Error pinning to IPFS:", error);
		throw error;
	}
}

async function extractImageCid(text: string): Promise<void> {
	const markdownLinkRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
	const cidRegex = /\/ipfs\/(Qm[1-9A-Za-z]{44}|baf[1-9A-Za-z]{56})/;

	const matches = [...text.matchAll(markdownLinkRegex)];
	for (const match of matches) {
		console.log("Found Markdown Link: ", match[1]);

		const url = match[1];
		const cidMatch = url.match(cidRegex);
		if (cidMatch && cidMatch[1]) {
			console.log("Found CID: ", cidMatch[1]);

			const cid = cidMatch[1];
			// Pinning by CID feature was moved in paid plan
			// await pinToIPFS(cid);
		}
	}
}

export async function processQuestion(question: any): Promise<any> {
	console.log("Processing Question: ", question.text);

	// Process images in the question text
	await extractImageCid(question.text);

	// Process question options
	if (question.options && Array.isArray(question.options)) {
		question.options = await Promise.all(
			question.options.map(async (option: any) => {
				// Process images in the option text
				await extractImageCid(option.text);
				return option;
			})
		);
	}

	return question;
}

export function isExamCompleted(exam: ExamDocument): boolean {
	const startTime = new Date(exam.startDate);
	const endTime = startTime.getTime() + exam.duration * 60000;
	const currentDateTime = new Date().getTime();
	return endTime < currentDateTime;
}

export function checkExamTimes(exam: ExamDocument): {
	valid: boolean;
	message?: string;
} {
	const now = new Date().getTime();
	const startTime = new Date(exam.startDate).getTime();
	const endTime = startTime + exam.duration * 60000;

	if (now < startTime) {
		return {
			valid: false,
			message: "Exam has not started yet",
		};
	}

	if (now > endTime) {
		return {
			valid: false,
			message: "Exam has ended",
		};
	}

	return { valid: true };
}

export function parseMina(amount: string | number): string {
	return (Number(amount.toString()) * 1_000_000_000).toString();
}

export function formatMina(amount: string | number): string {
	const bigIntAmount = BigInt(amount.toString());
	const quotient = bigIntAmount / BigInt(1_000_000_000);
	const remainder = bigIntAmount % BigInt(1_000_000_000);

	// Convert remainder to decimal places
	const decimals = remainder.toString().padStart(9, "0");
	// Remove trailing zeros
	const trimmedDecimals = decimals.replace(/0+$/, "");
	// Take only first 5 digits if longer
	const limitedDecimals = trimmedDecimals.slice(0, 5);

	return limitedDecimals ? `${quotient}.${limitedDecimals}` : quotient.toString();
}

export function generatePasscodes(count: number): string[] {
	const passcodes: string[] = [];

	for (let i = 0; i < count; i++) {
		const passcode = uuidv4();
		passcodes.push(passcode);
	}

	return passcodes;
}

export function generatePinCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let pincode = "";
	for (let i = 0; i < 6; i++) {
		pincode += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return pincode;
}
