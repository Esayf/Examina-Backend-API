import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import redisClient from "./config/redis.js";
import mongoose from "mongoose";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import memorystore from "memorystore";
import compression from "compression";
import morgan from "morgan";
// Import routes
import examRoutes from "./routes/exam.route.js";
import userRoutes from "./routes/user.route.js";
import answerRoutes from "./routes/answer.route.js";
import questionRoutes from "./routes/question.route.js";
import scoreRoutes from "./routes/score.route.js";
// Import cron jobs
import checkCompletedExams from "./cron/checkCompletedExams.js";
import checkParticipantScoreAndMail from "./cron/checkParticipantScoreAndMail.js";
dotenv.config();
const app = express();
// Compression middleware
app.use(compression({
    filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6,
    threshold: 500 * 1024,
}));
// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
// CORS setup
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "https://choz.io",
        "https://choz.io/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
// Session setup
const MongoDBStoreSession = MongoDBStore(session);
const MemoryStore = memorystore(session);
const sessionConfig = {
    secret: process.env.SESSION_SECRET || "examina the best",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
};
// Set up store based on environmen
if (process.env.NODE_ENV === "development") {
    sessionConfig.store = new MemoryStore({
        checkPeriod: 86400000,
    });
}
else {
    app.set("trust proxy", 1);
    const store = new MongoDBStoreSession({
        uri: `${process.env.MONGO_URI}/connect_mongodb_session_test`,
        collection: "sessions",
        expires: 24 * 60 * 60 * 1000,
        connectionOptions: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    });
    store.on("error", function (error) {
        console.error("Session store error:", error);
    });
    sessionConfig.store = store;
}
// Apply session middleware
app.use(session(sessionConfig));
// Health check route
app.get("/health", (req, res) => {
    try {
        res.status(200).json({
            status: "OK",
            mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
            redis: redisClient.status === "ready" ? "Connected" : "Disconnected",
        });
    }
    catch (error) {
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
        // Global error handler
        app.use((err, req, res, next) => {
            console.error("Error:", err);
            res.status(500).json({
                status: "error",
                message: err.message || "Internal server error",
            });
        });
        // Handle 404
        app.use((req, res) => {
            res.status(404).json({
                status: "error",
                message: "Route not found",
            });
        });
    }
    catch (error) {
        console.error("Failed to initialize app:", error);
        throw error;
    }
};
// Initialize the app
await initializeApp();
export default app;
