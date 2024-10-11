const User = require("../models/user.model");
var Client = require("mina-signer");
const signerClient = new Client({ network: "mainnet" });

async function findUserByWalletAddress(walletAddress) {
	const user = await User.find({ walletAddress: walletAddress });
	return user;
}

async function createUser(walletAddress) {
	const newUser = new User({
		username: walletAddress,
		walletAddress: walletAddress,
	});
	const savedUser = await newUser.save();
	return savedUser;
}

async function verifySignature(message, walletAddress, signature) {
	const parsedSignature =
		typeof signature === "string" ? JSON.parse(signature) : signature;
	const verifyBody = {
		data: { message: message },
		publicKey: walletAddress,
		signature: parsedSignature,
	};
	const verifyResult = await signerClient.verifyMessage(verifyBody);
	console.log("Result: ", verifyResult);
	return verifyResult;
}

module.exports = { findUserByWalletAddress, createUser, verifySignature };
