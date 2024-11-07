import { Response, NextFunction } from "express";
import { CustomRequest } from "../types";
import { finishExamSchema } from "../validators/examValidators";

export function ensureAuthenticated(req: CustomRequest, res: Response, next: NextFunction): Response | void {
	if (req.session && req.session.user) {
		return next();
	}
	return res.status(401).json({ message: "Unauthorized" });
}

export function ensureAdmin(req: CustomRequest, res: Response, next: NextFunction): Response | void {
	if (req.session?.user?.isAdmin) {
		return next();
	}
	return res.status(403).json({ message: "Admin access required" });
}

export function validateSessionToken(req: CustomRequest, res: Response, next: NextFunction): Response | void {
	if (!req.session.token) {
		return res.status(401).json({ message: "No session token found" });
	}
	return next();
}

export function validateRequestedEmail(req: CustomRequest, res: Response, next: NextFunction): Response | void {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!req.body.email || !emailRegex.test(req.body.email)) {
		return res.status(400).json({ message: "Invalid email format" });
	}
	return next();
}

export function validateBody(req: CustomRequest, res: Response, next: NextFunction): Response | void {
	const { error } = finishExamSchema.validate(req.body);
	if (error) {
		return res.status(400).json({ message: error.details[0].message });
	}
	return next();
}

export function errorHandler(err: Error, req: CustomRequest, res: Response, next: NextFunction): Response {
	console.error("Error:", err);
	return res.status(500).json({ message: "Internal server error" });
}
