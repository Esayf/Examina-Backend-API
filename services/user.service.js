const User = require("../models/user.model");
const sessionHelper = require("../helpers/sessionHelper");

async function getByWalletAddress(walletAddress) {
	try {
		const user = await User.find({ walletAddress: walletAddress });
		return user;
	} catch (error) {
		console.error("Error finding user by wallet address: ", error);
		throw new Error("Error finding user by wallet address");
	}
}

async function getById(userId) {
	try {
		const user = await User.findById(userId);
		return user;
	} catch (error) {
		console.error("Error finding user by ID: ", error);
		throw new Error("Error finding user by ID");
	}
}

async function getAll() {
	try {
		const users = await User.find();
		return users;
	} catch (error) {
		console.error("Error finding all users: ", error);
		throw new Error("Error finding all users");
	}
}

async function create(walletAddress) {
	try {
		const newUser = new User({
			username: walletAddress,
			walletAddress: walletAddress,
		});
		const savedUser = await newUser.save();
		return savedUser;
	} catch (error) {
		console.error("Error creating new user: ", error);
		throw new Error("Error creating new user");
	}
}

async function findAndLogin(req, walletAddress) {
	try {
		let user = await getByWalletAddress(walletAddress);
		sessionHelper.setSessionUser(req, user[0]);
		return user[0];
	} catch (error) {
		console.error("Error finding and logging in user: ", error);
		throw new Error("Error finding and logging in user");
	}
}

async function createAndRegister(req, walletAddress) {
	try {
		let newUser = await create(walletAddress);
		sessionHelper.setSessionUser(req, newUser);
		return newUser;
	} catch (error) {
		console.error("Error creating and registering new user: ", error);
		throw new Error("Error creating and registering new user");
	}
}

async function registerOrLogin(req, walletAddress) {
	try {
		let user = await getByWalletAddress(walletAddress);
		if (user.length === 0) {
			return await createAndRegister(req, walletAddress);
		} else {
			return await findAndLogin(req, walletAddress);
		}
	} catch (error) {
		console.error("Error during register or login: ", error);
		throw new Error("Error during register or login");
	}
}

async function updateEmail(userId, email) {
	try {
		let user = await getById(userId);
		user.email = email;
		const savedUser = await user.save();
		return savedUser;
	} catch (error) {
		console.error("Error in updating user email: ", error);
		throw new Error("Error updating user email");
	}
}

module.exports = {
	getByWalletAddress,
	getById,
	getAll,
	create,
	registerOrLogin,
	updateEmail,
};
