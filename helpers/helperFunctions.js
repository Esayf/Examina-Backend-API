var Client = require("mina-signer");
const signerClient = new Client({ network: "mainnet" });
const axios = require("axios");

function verifySignature(message, walletAddress, signature) {
	const parsedSignature =
		typeof signature === "string" ? JSON.parse(signature) : signature;
	const parsedMessage =
		typeof message === "string" ? message.toString() : message;
	const verifyBody = {
		data: parsedMessage,
		publicKey: walletAddress,
		signature: parsedSignature,
	};
	const verifyResult = signerClient.verifyMessage(verifyBody);
	console.log("Result: ", verifyResult);
	return verifyResult;
}

function validateEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

async function pinToIPFS(hash) {
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
					pinata_api_key: process.env.PINATA_API_KEY,
					pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
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

async function extractImageCid(text) {
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
			await pinToIPFS(cid);
		}
	}
}

async function processQuestion(question) {
	console.log("Processing Question: ", question.text);

	// Process images in the question text
	await extractImageCid(question.text);

	// Process question options
	if (question.options && Array.isArray(question.options)) {
		question.options = await Promise.all(
			question.options.map(async (option) => {
				// Process images in the option text
				await extractImageCid(option.text);
				return option;
			})
		);
	}

	return question;
}

module.exports = {
	verifySignature,
	validateEmail,
	pinToIPFS,
	extractImageCid,
	processQuestion,
};
