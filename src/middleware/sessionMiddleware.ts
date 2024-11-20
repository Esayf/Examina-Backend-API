import { Response, NextFunction } from "express";
import { CustomRequest, SessionUser } from "../types";
import redisClient from "../config/redis";

function getStableCookieId(req: CustomRequest): string | null {
	const cookies = req.headers.cookie?.split(";");
	const sessionCookie = cookies?.find((cookie) => cookie.trim().startsWith("choz.sid="));
	return sessionCookie ? sessionCookie.split("=")[1].trim() : null;
}

export async function syncSessionFromRedis(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
	try {
		const cookieId = getStableCookieId(req);

		if (cookieId) {
			// Get all session data from Redis
			const [token, message, userData] = await Promise.all([
				redisClient.get(`auth:${cookieId}:token`),
				redisClient.get(`auth:${cookieId}:message`),
				redisClient.get(`auth:${cookieId}:user`),
			]);

			// Update session with Redis data
			if (token) req.session.token = token;
			if (message) req.session.message = message;
			if (userData) {
				const user: SessionUser = JSON.parse(userData);
				req.session.user = user;
			}

			// Debug log
			console.log("Session synced from Redis:", {
				cookieId,
				sessionId: req.sessionID,
				token: req.session.token,
				message: req.session.message,
				user: req.session.user,
			});
		}

		next();
	} catch (error) {
		console.error("Error syncing session from Redis:", error);
		next();
	}
}
