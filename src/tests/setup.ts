import { beforeAll, afterAll, afterEach } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Session, SessionData } from "express-session";
import { expect } from "bun:test";
import { CustomRequest } from "@/typings";

let mongoServer: MongoMemoryServer;

// Extend SessionData to include our custom properties
interface CustomSessionData extends SessionData {
	user: {
		userId: string;
		walletAddress: string;
		isAdmin: boolean;
	} | null;
	token: string | null;
	message: string | null;
}

// Mock session with proper typing
export const mockSession = {
	user: null,
	token: null,
	message: null,
	save: (cb: (err: any) => void) => cb(null),
	destroy: (cb: (err: any) => void) => cb(null),
} as unknown as Session & Partial<CustomSessionData>;

export const createMockRequest = (body: any = {}, params: any = {}, user: any): CustomRequest =>
	({
		session: {
			...mockSession,
			user: {
				userId: user._id.toString(),
				walletAddress: user.walletAddress,
				isAdmin: false,
			},
		},
		body,
		params,
	}) as CustomRequest;
// Mock response creator
export const createMockResponse = () => {
	const res: any = {};
	res.status = (code: number | undefined) => {
		res.statusCode = code;
		return res;
	};
	res.json = (data: any) => {
		res.body = data;
		return res;
	};
	return res;
};

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	try {
		await mongoose.connect(mongoUri, {
			connectTimeoutMS: 10000,
		});

		// Wait for connection to be ready
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("MongoDB connection timeout"));
			}, 15000);

			if (mongoose.connection.readyState === 1) {
				clearTimeout(timeout);
				resolve(true);
			} else {
				mongoose.connection.once("connected", () => {
					clearTimeout(timeout);
					resolve(true);
				});

				mongoose.connection.once("error", (err) => {
					clearTimeout(timeout);
					reject(err);
				});
			}
		});
	} catch (error) {
		console.error("MongoDB connection error:", error);
		throw error;
	}
});

afterEach(async () => {
	// Ensure connection is active before clearing
	if (mongoose.connection.readyState === 1) {
		const collections = mongoose.connection.collections;
		await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
	}
});

// Custom assertions
export const expectStatus = (res: any, status: number) => {
	expect(res.statusCode).toBe(status);
};

export const expectJson = (res: any, body: any) => {
	expect(res.body).toEqual(body);
};
