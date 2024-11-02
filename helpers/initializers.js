const User = require("../models/user.model");

async function initializeAdmin() {
	try {
		const admin = await User.findOne({ role: "admin" });
		if (!admin) {
			const adminUser = new User({
				username: process.env.ADMIN_USERNAME,
				email: process.env.ADMIN_EMAIL,
				walletAddress: process.env.ADMIN_WALLET_ADDRESS,
				role: "admin",
			});
			await adminUser.save();
			return adminUser;
		} else {
			console.log("Admin is already exist");
			return admin;
		}
	} catch (error) {
		console.error("Error initializing admin: ", error);
		throw new Error("Error initializing admin");
	}
}

module.exports = { initializeAdmin };
