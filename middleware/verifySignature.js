const userService = require("../services/user.service");
const verifySignature = async (req, res, next) => {
	const { walletAddress, signature } = req.body;
	const message = req.session.message;

	const verifyResult = await userService.verifySignature(
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
