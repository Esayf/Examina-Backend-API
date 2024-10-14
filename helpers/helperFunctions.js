var Client = require("mina-signer");
const signerClient = new Client({ network: "mainnet" });

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

module.exports = { verifySignature, validateEmail };
