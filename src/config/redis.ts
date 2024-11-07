import Redis from "ioredis";

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
	throw new Error("Redis configuration is missing in environment variables");
}

const redisClient = new Redis({
	host: process.env.REDIS_HOST,
	port: Number(process.env.REDIS_PORT),
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
