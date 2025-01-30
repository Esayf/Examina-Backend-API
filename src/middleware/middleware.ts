import { Request, Response, NextFunction, RequestHandler } from "express";
import { CustomRequest } from "../types";
import verifySignature from "../helpers/helperFunctions";
import { Schema } from "joi";

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

export function verifyUserSignature(req: CustomRequest, res: Response, next: NextFunction): Response | void {
	const { walletAddress, signature } = req.body;
	const message = req.session?.message;
	if (!message) {
		return res.status(401).json({ success: false, message: "No session token" });
	}

	const verifyResult = verifySignature(message, walletAddress, signature);

	if (!verifyResult) {
		res.status(400).json({ success: false, message: "Invalid signature" });
		return;
	}

	next();
}

export function validateRequestedEmail(req: CustomRequest, res: Response, next: NextFunction): Response | void {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!req.body.email || !emailRegex.test(req.body.email)) {
		return res.status(400).json({ message: "Invalid email format" });
	}
	return next();
}

export const validateSchema = (schema: Schema): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const { error } = schema.validate(req.body, { abortEarly: false });

		if (error) {
			res.status(400).json({
				message: "Validation error",
				errors: error.details.map((detail) => detail.message),
			});
			return;
		}

		next();
	};
};

export function errorHandler(err: Error, req: CustomRequest, res: Response, next: NextFunction): Response {
	console.error("Error:", err);
	return res.status(500).json({ message: "Internal server error" });
}
