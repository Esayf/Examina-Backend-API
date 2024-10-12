const User = require("../models/user.model");
const sessionHelper = require("../helpers/sessionHelper");

async function findUserByWalletAddress(walletAddress) {
	const user = await User.find({ walletAddress: walletAddress });
	if (!user) {
		throw new Error("User not found");
	}
	return user;
}

async function findUserById(userId) {
	const user = await User.findById(userId);
	if (!user) {
		throw new Error("User not found");
	}
	return user;
}

async function findAllUsers() {
	const users = await User.find();
	if (!users) {
		throw new Error("Users not found");
	}
	return users;
}

async function createUser(walletAddress) {
	const newUser = new User({
		username: walletAddress,
		walletAddress: walletAddress,
	});
	const savedUser = await newUser.save();
	return savedUser;
}

async function findAndRegisterUser(req, walletAddress) {
	let user = await findUserByWalletAddress(walletAddress);
	sessionHelper.setSessionUser(req, user[0]);
	return user[0];
}

async function createAndRegisterUser(req, walletAddress) {
	let newUser = await createUser(walletAddress);
	sessionHelper.setSessionUser(req, newUser);
	return newUser;
}

async function registerOrCreateUser(req, walletAddress) {
	let user = await findUserByWalletAddress(walletAddress);
	if (user.length === 0) {
		return await createAndRegisterUser(req, walletAddress);
	} else {
		return await findAndRegisterUser(req, walletAddress);
	}
}

async function updateUserEmail(userId, email) {
	let user = await findUserById(userId);
	user.email = email;
	const savedUser = await user.save();
	return savedUser;
}

module.exports = {
	findUserByWalletAddress,
	findUserById,
	findAllUsers,
	createUser,
	registerOrCreateUser,
	updateUserEmail,
};
