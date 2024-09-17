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

module.exports = router;
