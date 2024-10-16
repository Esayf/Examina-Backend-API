const User = require("../models/user.model");
const sessionHelper = require("../helpers/sessionHelper");

async function getByWalletAddress(walletAddress) {
	try {
		const user = await User.find({ walletAddress: walletAddress });
		if (!user) {
			throw new Error("User not found");
		}
		return user;
	} catch (error) {
		console.error("Error in findUserByWalletAddress: ", error);
		throw new Error("Error finding user by wallet address");
	}
}

async function getById(userId) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error("User not found");
		}
		return user;
	} catch (error) {
		console.error("Error in findUserById: ", error);
		throw new Error("Error finding user by ID");
	}
}

async function getAll() {
	try {
		const users = await User.find();
		if (!users) {
			throw new Error("Users not found");
		}
		return users;
	} catch (error) {
		console.error("Error in findAllUsers: ", error);
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
		console.error("Error in createUser: ", error);
		throw new Error("Error creating new user");
	}
}

async function findAndLogin(req, walletAddress) {
	try {
		let user = await getByWalletAddress(walletAddress);
		sessionHelper.setSessionUser(req, user[0]);
		return user[0];
	} catch (error) {
		console.error("Error in findAndLogin: ", error);
		throw new Error("Error finding and logging in user");
	}
}

async function createAndRegister(req, walletAddress) {
	try {
		let newUser = await createUser(walletAddress);
		sessionHelper.setSessionUser(req, newUser);
		return newUser;
	} catch (error) {
		console.error("Error in createAndRegister: ", error);
		throw new Error("Error creating and registering new user");
	}
}

async function registerOrLogin(req, walletAddress) {
	try {
		let user = await findByWalletAddress(walletAddress);
		if (user.length === 0) {
			return await createAndRegister(req, walletAddress);
		} else {
			return await findAndLogin(req, walletAddress);
		}
	} catch (error) {
		console.error("Error in registerOrLogin: ", error);
		throw new Error("Error during register or login");
	}
}

async function updateEmail(userId, email) {
	try {
		let user = await findById(userId);
		user.email = email;
		const savedUser = await user.save();
		return savedUser;
	} catch (error) {
		console.error("Error in updateUserEmail: ", error);
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
