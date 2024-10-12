const helperFunctions = require("../helpers/helperFunctions");
const verifySignature = (req, res, next) => {
	const { walletAddress, signature } = req.body;
	const message = req.session.message;

	const verifyResult = helperFunctions.verifySignature(
		message,
		walletAddress,
		signature
	);
	console.log("Result Result: ", verifyResult);

	if (!verifyResult) {
		return res
			.status(401)
			.json({ success: false, message: "Invalid signature" });
	}

	next();
};

module.exports = verifySignature;
