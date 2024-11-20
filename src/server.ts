import app from "./app.js";
import mongoose from "mongoose";
import redisClient from "./config/redis.js";

const PORT = process.env.PORT || 3000;

// Initialize server
const initializeServer = async () => {
	try {
		// Start server
		const server = app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});

		// Handle server errors
		server.on("error", (error) => {
			console.error("Server error:", error);
		});

		// Graceful shutdown
		process.on("SIGTERM", async () => {
			console.log("SIGTERM received. Starting graceful shutdown");
			await mongoose.connection.close();
			await redisClient.quit();
			server.close(() => {
				console.log("Server closed");
				process.exit(0);
			});
		});
	} catch (error) {
		console.error("Failed to initialize server:", error);
		process.exit(1);
	}
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	process.exit(1);
});

// Handle unhandled rejections
process.on("unhandledRejection", (error) => {
	console.error("Unhandled Rejection:", error);
	process.exit(1);
});

// Start the server
initializeServer();

export default app;
