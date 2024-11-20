import { Request } from "express";
import { CustomSession, SessionUser } from "../types";

function createTokenAndMessage(req: Request, walletAddress: string): string {
	const token = Math.random().toString(36).substring(7);
	(req.session as CustomSession).token = token;
	const message = `${token}${walletAddress}`;
	(req.session as CustomSession).message = process.env.NODE_ENV == "test" ? { message } : message;
	req.session.save();
	return message;
}

function getSessionUser(req: Request): SessionUser | null {
	return (req.session as CustomSession).user || null;
}

function setSessionUser(req: Request, sessionUser: SessionUser): void {
	(req.session as CustomSession).user = sessionUser;
	req.session.save();
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
