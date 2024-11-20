import Redis from "ioredis";
import { RedisOptions } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

const redisClient = new Redis({
	host: REDIS_HOST,
	port: REDIS_PORT,
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
	retryStrategy(times: number) {
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
});

redisClient.on("connect", () => {
	console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
	console.error("Redis connection error:", err);
});

redisClient.on("close", () => {
	console.log("Redis connection closed");
});

process.on("SIGINT", () => {
	redisClient.quit().then(() => {
		console.log("Redis connection closed through app termination");
	});
});

export default redisClient;
