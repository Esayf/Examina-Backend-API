import { Request } from "express";
import { SessionUser } from "../types";
import redisClient from "../config/redis";

// Helper to get the stable cookie ID
function getStableCookieId(req: Request): string | null {
	const cookies = req.headers.cookie?.split(";");
	const sessionCookie = cookies?.find((cookie) => cookie.trim().startsWith("connect.sid="));
	return sessionCookie ? sessionCookie.split("=")[1].trim() : null;
}

async function createTokenAndMessage(req: Request, walletAddress: string): Promise<string> {
	const token = Math.random().toString(36).substring(7);
	const message = `${token}${walletAddress}`;
	const cookieId = getStableCookieId(req);

	if (!cookieId) {
		throw new Error("No session cookie found");
	}

	// Store in Redis with the cookie ID
	await redisClient
		.multi()
		.set(`auth:${cookieId}:token`, token)
		.set(`auth:${cookieId}:message`, message)
		.expire(`auth:${cookieId}:token`, 300) // 5 minutes
		.expire(`auth:${cookieId}:message`, 300)
		.exec();

	// Also store in session as backup
	req.session.token = token;
	req.session.message = message;

	console.log("Session data saved:", {
		cookieId,
		token,
		message,
		cookie: req.headers.cookie,
	});

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
	const cookieId = getStableCookieId(req);

	if (!cookieId) {
		throw new Error("No session cookie found");
	}

	// Store user data in Redis
	await redisClient
		.multi()
		.set(`auth:${cookieId}:user`, JSON.stringify(sessionUser))
		.expire(`auth:${cookieId}:user`, 86400) // 24 hours
		.exec();

	// Also store in session
	req.session.user = sessionUser;

	console.log("User session saved:", {
		cookieId,
		user: sessionUser,
		cookie: req.headers.cookie,
	});

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
	const cookieId = getStableCookieId(req);
	if (!cookieId) return null;

	// Try to get from Redis first
	const userData = await redisClient.get(`auth:${cookieId}:user`);
	if (userData) {
		const user = JSON.parse(userData);
		// Refresh session
		req.session.user = user;
		return user;
	}

	return req.session.user || null;
}

async function destroySession(req: Request, callback: (err?: any) => void): Promise<void> {
	const cookieId = getStableCookieId(req);
	if (cookieId) {
		// Clear Redis data
		await redisClient.del(`auth:${cookieId}:token`, `auth:${cookieId}:message`, `auth:${cookieId}:user`);
	}

	req.session.destroy(callback);
}

export default {
	createTokenAndMessage,
	setSessionUser,
	getSessionUser,
	destroySession,
	getStableCookieId,
};
