import { beforeAll, afterAll, afterEach } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Session, SessionData } from "express-session";
import { expect } from "bun:test";

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
	// Setup MongoDB Memory Server
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();
	await mongoose.connect(mongoUri);

	// Mock environment variables
	process.env.NODE_ENV = "test";
	process.env.SESSION_SECRET = "test-secret";
});

afterEach(async () => {
	// Clear all collections
	const collections = mongoose.connection.collections;
	for (const key in collections) {
		await collections[key].deleteMany({});
	}

	// Reset session mock with proper typing
	if (mockSession) {
		mockSession.user = undefined;
		mockSession.token = undefined;
		mockSession.message = undefined;
	}
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

// Custom assertions
export const expectStatus = (res: any, status: number) => {
	expect(res.statusCode).toBe(status);
};

export const expectJson = (res: any, body: any) => {
	expect(res.body).toEqual(body);
};
