import { Response } from "express";
import { CustomRequest } from "../types";
import userService from "../services/user.service";
import sessionHelper from "../helpers/sessionHelper";

async function getMessageToSign(req: CustomRequest, res: Response) {
	try {
		const { walletAddress } = req.params;
		if (!walletAddress) {
			return res.status(400).json({ message: "Wallet address is required" });
		}
		const message = sessionHelper.createTokenAndMessage(req, walletAddress);
		return res.json({ message });
	} catch (error) {
		console.error("Error creating message: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function registerUser(req: CustomRequest, res: Response) {
	try {
		const { walletAddress } = req.body;
		if (!walletAddress) {
			return res.status(400).json({ message: "Wallet address is required" });
		}
		const user = await userService.registerOrLogin(req, walletAddress);
		console.log("The return value of registerOrLogin: ", {
			success: true,
			session: req.session.user,
			user,
		});
		return res.json({
			success: true,
			session: req.session.user,
			user,
		});
	} catch (error) {
		console.error("Error registering user:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getSession(req: CustomRequest, res: Response) {
	try {
		if (!req.session.user) {
			return res.status(401).json({ message: "No active session" });
		}
		return res.status(200).json({ success: true, session: req.session.user });
	} catch (error) {
		console.error("Error getting session:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function logout(req: CustomRequest, res: Response) {
	try {
		sessionHelper.destroySession(req, (err) => {
			if (err) {
				console.error("Error destroying session:", err);
				return res.status(500).json({ message: "Failed to logout" });
			}
			return res.json({ success: true, message: "Logged out" });
		});
	} catch (error) {
		console.error("Error logging out:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllUsers(req: CustomRequest, res: Response) {
	try {
		const users = await userService.getAll();
		if (!users || users.length === 0) {
			return res.status(404).json({ message: "No users found" });
		}
		return res.status(200).json(users);
	} catch (error) {
		console.error("Error getting users:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function putEmail(req: CustomRequest, res: Response) {
	try {
		const userId = req.session.user?.userId;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		await userService.updateEmail(userId, email);
		return res.status(200).json({ message: "Email updated successfully" });
	} catch (error) {
		console.error("Error updating email:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export default {
	getMessageToSign,
	registerUser,
	getSession,
	logout,
	getAllUsers,
	putEmail,
};
