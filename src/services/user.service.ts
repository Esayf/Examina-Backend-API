import { Request } from "express";
import { UserDocument, SessionUser } from "@/typings";
import User from "../models/user.model";
import sessionHelper from "../helpers/sessionHelper";

async function getByWalletAddress(walletAddress: string): Promise<UserDocument | null> {
	try {
		return await User.findOne({ walletAddress: walletAddress });
	} catch (error) {
		console.error("Error finding user by wallet address: ", error);
		throw new Error("Error finding user by wallet address");
	}
}

async function getById(userId: string): Promise<UserDocument | null> {
	try {
		return await User.findById(userId);
	} catch (error) {
		console.error("Error finding user by ID: ", error);
		throw new Error("Error finding user by ID");
	}
}

async function getAll(): Promise<UserDocument[]> {
	try {
		return await User.find();
	} catch (error) {
		console.error("Error finding all users: ", error);
		throw new Error("Error finding all users");
	}
}

async function create(walletAddress: string): Promise<UserDocument> {
	try {
		const isAdmin = walletAddress === process.env.ADMIN_PUBLIC_KEY;
		const newUser = new User({
			username: walletAddress,
			walletAddress: walletAddress,
			isAdmin: isAdmin,
		});
		return await newUser.save();
	} catch (error) {
		console.error("Error creating new user: ", error);
		throw new Error("Error creating new user");
	}
}

async function createAndRegister(req: Request, walletAddress: string): Promise<UserDocument> {
	let newUser = await create(walletAddress);
	const sessionUser: SessionUser = {
		userId: newUser.id,
		walletAddress: newUser.walletAddress,
		isAdmin: newUser.isAdmin,
	};
	await sessionHelper.setSessionUser(req, sessionUser);
	return newUser;
}

async function findAndLogin(req: Request, walletAddress: string): Promise<UserDocument> {
	try {
		let user = await getByWalletAddress(walletAddress);
		if (!user) {
			throw new Error("User not found");
		}
		if (walletAddress === process.env.ADMIN_PUBLIC_KEY && !user.isAdmin) {
			user.isAdmin = true;
			await user.save();
		}
		const sessionUser: SessionUser = {
			userId: user.id,
			walletAddress: user.walletAddress,
			isAdmin: user.isAdmin,
		};
		await sessionHelper.setSessionUser(req, sessionUser);
		return user;
	} catch (error) {
		console.error("Error finding and logging in user: ", error);
		throw new Error("Error finding and logging in user");
	}
}

async function registerOrLogin(req: Request, walletAddress: string): Promise<UserDocument> {
	let user = await getByWalletAddress(walletAddress);

	if (!user) {
		return await createAndRegister(req, walletAddress);
	} else {
		return await findAndLogin(req, walletAddress);
	}
}

async function updateEmail(userId: string, email: string): Promise<void> {
	try {
		const user = await User.findById(userId);
		if (user && user.email !== email) {
			await User.findByIdAndUpdate(userId, { email });
		}
	} catch (error) {
		console.error("Error updating user email: ", error);
		throw new Error("Error updating user email");
	}
}

async function verifyAdmin(userId: string): Promise<boolean> {
	try {
		const user = await User.findById(userId);
		return user?.isAdmin || false;
	} catch (error) {
		console.error("Error verifying admin status: ", error);
		return false;
	}
}

export default {
	getByWalletAddress,
	getById,
	getAll,
	create,
	registerOrLogin,
	updateEmail,
	verifyAdmin,
};
