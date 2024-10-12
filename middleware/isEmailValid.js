// NAMING AND MIDDLEWARE STRUCTURE ISSUES
const { validateEmail } = require("../helpers/helperFunctions");

const isEmailValid = (req, res, next) => {
	const { email } = req.body;
	if (!validateEmail(email)) {
		return res.status(400).json({ message: "Invalid email" });
	}
	next();
};

module.exports = isEmailValid;
