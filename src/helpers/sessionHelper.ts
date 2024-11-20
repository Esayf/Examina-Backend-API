import { Request } from "express";
import { SessionUser } from "../types";

function createTokenAndMessage(req: Request, walletAddress: string): string {
	const token = Math.random().toString(36).substring(7);
	req.session.token = token;
	const message = `${token}${walletAddress}`;
	req.session.message = process.env.NODE_ENV == "test" ? { message } : message;
	req.session.save();
	return message;
}

function getSessionUser(req: Request): { message: string } | string | null {
	console.log(req.session.message);
	return req.session.message || null;
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
