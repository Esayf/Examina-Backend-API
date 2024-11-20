import { Request } from "express";
import { SessionUser } from "../types";
import redisClient from "../config/redis";
import crypto from "crypto";

// Generate a stable session ID based on user data
function generateStableSessionId(walletAddress: string): string {
	return crypto.createHash("sha256").update(`${walletAddress}-${process.env.SESSION_SECRET}`).digest("hex");
}

async function createTokenAndMessage(req: Request, walletAddress: string): Promise<string> {
	const token = Math.random().toString(36).substring(7);
	const message = `${token}${walletAddress}`;
	const stableSessionId = generateStableSessionId(walletAddress);

	// Store in Redis with the stable session ID
	await redisClient
		.multi()
		.set(`auth:${stableSessionId}:token`, token)
		.set(`auth:${stableSessionId}:message`, message)
		.expire(`auth:${stableSessionId}:token`, 300) // 5 minutes
		.expire(`auth:${stableSessionId}:message`, 300)
		.exec();

	// Also store in session as backup
	req.session.stableId = stableSessionId;
	req.session.token = token;
	req.session.message = message;

	await new Promise<void>((resolve, reject) => {
		req.session.save((err) => {
			if (err) {
				console.error("Session save error:", err);
				reject(err);
			}
			resolve();
		});
	});

	return message;
}

async function setSessionUser(req: Request, sessionUser: SessionUser): Promise<void> {
	const stableSessionId = generateStableSessionId(sessionUser.walletAddress);

	// Store user data in Redis
	await redisClient
		.multi()
		.set(`auth:${stableSessionId}:user`, JSON.stringify(sessionUser))
		.expire(`auth:${stableSessionId}:user`, 86400) // 24 hours
		.exec();

	// Also store in session
	req.session.stableId = stableSessionId;
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

async function getSessionUser(req: Request): Promise<SessionUser | null> {
	const stableId = req.session.stableId;
	if (!stableId) return null;

	// Try to get from Redis first
	const userData = await redisClient.get(`auth:${stableId}:user`);
	if (userData) {
		const user = JSON.parse(userData);
		// Refresh session
		req.session.user = user;
		return user;
	}

	return req.session.user || null;
}

async function destroySession(req: Request, callback: (err?: any) => void): Promise<void> {
	const stableId = req.session.stableId;
	if (stableId) {
		// Clear Redis data
		await redisClient.del(`auth:${stableId}:token`, `auth:${stableId}:message`, `auth:${stableId}:user`);
	}

	req.session.destroy(callback);
}

export default {
	createTokenAndMessage,
	setSessionUser,
	getSessionUser,
	destroySession,
	generateStableSessionId,
};
