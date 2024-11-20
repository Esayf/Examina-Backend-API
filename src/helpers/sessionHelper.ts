import { Request } from "express";
import { SessionUser } from "../types";
import redisClient from "../config/redis";

async function createTokenAndMessage(req: Request, walletAddress: string): Promise<string> {
	const token = Math.random().toString(36).substring(7);
	const message = `${token}${walletAddress}`;

	// Set session data
	req.session.token = token;
	req.session.message = process.env.NODE_ENV === "test" ? { message } : message;

	try {
		// Save to session
		await new Promise<void>((resolve, reject) => {
			req.session.save((err) => {
				if (err) {
					console.error("Session save error:", err);
					reject(err);
				}
				resolve();
			});
		});

		// Backup to Redis directly with short TTL
		await redisClient.setex(
			`backup:${req.sessionID}:token`,
			300, // 5 minutes
			token
		);
		await redisClient.setex(`backup:${req.sessionID}:message`, 300, message);

		console.log("Session saved:", {
			sessionId: req.sessionID,
			token,
			message,
		});

		return message;
	} catch (error) {
		console.error("Failed to save session:", error);
		throw new Error("Failed to create session message");
	}
}

async function getSessionData(req: Request) {
	// Try to get from session first
	if (req.session.token && req.session.message) {
		return {
			token: req.session.token,
			message: req.session.message,
		};
	}

	// Fallback to Redis backup
	const token = await redisClient.get(`backup:${req.sessionID}:token`);
	const message = await redisClient.get(`backup:${req.sessionID}:message`);

	if (token && message) {
		// Restore to session
		req.session.token = token;
		req.session.message = message;
		await new Promise<void>((resolve, reject) => {
			req.session.save((err) => {
				if (err) reject(err);
				resolve();
			});
		});
	}

	return { token, message };
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
