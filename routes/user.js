const express = require("express");
const router = express.Router();
const User = require("../models/User"); //Generate user route for get all users
router.get("/", async (req, res) => {
	try {
		const users = await User.find();
		res.status(200).json(users);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

function validateEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

router.post("/put/email", async (req, res) => {
	const { email } = req.body;
	if (!validateEmail(email)) {
		return res.status(400).json({ message: "Invalid email" });
	}
	try {
		const user = await User.findById(req.session.user.userId);
		user.email = email;
		await user.save();
		res.status(200).json({ success: true, user });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

module.exports = router;
