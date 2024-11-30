import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import redisClient from "./config/redis";
import mongoose from "mongoose";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import memorystore from "memorystore";
import compression from "compression";
import morgan from "morgan";

// Import routes
import examRoutes from "./routes/exam.route";
import userRoutes from "./routes/user.route";
import answerRoutes from "./routes/answer.route";
import questionRoutes from "./routes/question.route";
import scoreRoutes from "./routes/score.route";
import workerRoutes from "./routes/worker.route";

// Import cron jobs
import checkCompletedExams from "./cron/checkCompletedExams";
import checkParticipantScoreAndMail from "./cron/checkParticipantScoreAndMail";

dotenv.config();

const app = express();

// Compression middleware
app.use(
	compression({
		filter: (req, res) => {
			if (req.headers["x-no-compression"]) {
				return false;
			}
			return compression.filter(req, res);
		},
		level: 6,
		threshold: 500 * 1024,
	})
);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

// CORS setup - must come BEFORE session middleware
app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:8080",
			"https://choz.io",
			"https://choz.io/",
		],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
		exposedHeaders: ["set-cookie"],
	})
);

// Session setup
const MongoDBStoreSession = MongoDBStore(session);
const MemoryStore = memorystore(session);

const sessionConfig: session.SessionOptions = {
	secret: process.env.SESSION_SECRET || "examina the best",
	resave: false,
	saveUninitialized: true, // Changed to false
	cookie: {
		secure: false,
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
		path: "/",
		domain: process.env.NODE_ENV === "production" ? ".choz.io" : undefined,
	},
	proxy: process.env.NODE_ENV === "production", // Enable if behind a proxy
};

// Set up store based on environment
if (process.env.NODE_ENV === "development") {
	sessionConfig.store = new MemoryStore({
		checkPeriod: 86400000,
		ttl: 86400000, // 24 hours
		noDisposeOnSet: true,
		dispose: false,
	});
} else {
	const store = new MongoDBStoreSession({
		uri: `${process.env.MONGO_URI}/connect_mongodb_session_test`,
		collection: "sessions",
		expires: 24 * 60 * 60 * 1000, // 24 hours
		connectionOptions: {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		},
		autoReconnect: true,
		touchAfter: 24 * 3600, // Only update the session every 24 hours unless there are changes
	});

	store.on("error", function (error) {
		console.error("Session store error:", error);
	});

	sessionConfig.store = store;
}

// Apply session middleware
app.use(session(sessionConfig));

// Add session debug middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
	const oldEnd = res.end;
	res.end = function (...args: any[]) {
		console.log("Response Headers:", res.getHeaders());
		// @ts-ignore
		return oldEnd.apply(this, args);
	};

	console.log("Request Cookies:", req.headers.cookie);
	console.log("Session ID:", req.sessionID);
	console.log("Session Message:", req.session.message);
	console.log("Session User:", req.session.user);
	next();
});

// Health check route
app.get("/health", (req, res) => {
	try {
		res.status(200).json({
			status: "OK",
			mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
			redis: redisClient.status === "ready" ? "Connected" : "Disconnected",
		});
	} catch (error) {
		console.error("Error in health check:", error);
		res.status(500).json({ error: "Error in health check" });
	}
});

// Initialize app
const initializeApp = async () => {
	try {
		// Connect to MongoDB
		await connectDB();
		console.log("MongoDB connected successfully");

		// Test Redis connection
		await redisClient.ping();
		console.log("Redis connected successfully");

		// Initialize cron jobs
		checkCompletedExams();
		checkParticipantScoreAndMail();
		console.log("Cron jobs initialized");

		// Routes
		app.use("/exams", examRoutes);
		app.use("/users", userRoutes);
		app.use("/answers", answerRoutes);
		app.use("/questions", questionRoutes);
		app.use("/scores", scoreRoutes);
		app.use("/worker", workerRoutes);

		// Global error handler
		app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
			console.error("Error:", err);
			res.status(500).json({
				status: "error",
				message: err.message || "Internal server error",
			});
		});

		// Handle 404
		app.use((req: express.Request, res: express.Response) => {
			res.status(404).json({
				status: "error",
				message: "Route not found",
			});
		});
	} catch (error) {
		console.error("Failed to initialize app:", error);
		throw error;
	}
};

// Initialize the app
await initializeApp();

export default app;
