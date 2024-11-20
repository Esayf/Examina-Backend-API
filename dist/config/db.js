import mongoose from "mongoose";
export async function connectDB() {
    try {
        mongoose.set("strictQuery", false);
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("Failed to get MongoDB database.");
        }
        console.log(`MongoDB connected to ${mongoose.connection.host}`);
        // Check and create collections if they don't exist
        const collections = await db.collections();
        const existingCollections = collections.map((collection) => collection.collectionName);
        const models = Object.keys(mongoose.models);
        const modelNames = models.map((model) => model.toLowerCase() + "s");
        for (const model of modelNames) {
            if (!existingCollections.includes(model)) {
                await db.createCollection(model);
                console.log(`Collection ${model} created.`);
            }
        }
        return true;
    }
    catch (error) {
        console.error("Database connection error:", error);
        throw error;
    }
}
// Handle MongoDB connection errors
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});
mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
});
process.on("SIGINT", async () => {
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
    }
    catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
    }
});
