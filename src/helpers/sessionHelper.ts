import { Request } from "express";
import { SessionUser } from "../types";

async function createTokenAndMessage(req: Request, walletAddress: string): Promise<string> {
	const token = Math.random().toString(36).substring(7);
	req.session.token = token;
	const message = `${token}${walletAddress}`;
	req.session.message = process.env.NODE_ENV === "test" ? { message } : message;

	// Debug logs
	console.log("Setting session data:", {
		token: req.session.token,
		message: req.session.message,
	});

	try {
		// Wait for the session to be saved
		await new Promise<void>((resolve, reject) => {
			req.session.save((err) => {
				if (err) {
					console.error("Session save error:", err);
					reject(err);
				}
				console.log("Session saved successfully");
				resolve();
			});
		});

		// Verify session data after save
		console.log("Session data after save:", {
			token: req.session.token,
			message: req.session.message,
		});

		return message;
	} catch (error) {
		console.error("Failed to save session:", error);
		throw new Error("Failed to create session message");
	}
}

function getSessionUser(req: Request): SessionUser | null {
	return req.session.user || null;
}

async function setSessionUser(req: Request, sessionUser: SessionUser): Promise<void> {
	req.session.user = sessionUser;
	return new Promise((resolve, reject) => {
		req.session.save((err) => {
			if (err) {
				console.error("Session save error:", err);
				reject(err);
			}
			resolve();
		});
	});
}

function destroySession(req: Request, callback: (err?: any) => void): void {
	req.session.destroy(callback);
}

export default {
	getSessionUser,
	createTokenAndMessage,
	setSessionUser,
	destroySession,
};
