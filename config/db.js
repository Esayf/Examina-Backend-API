const mongoose = require("mongoose");
const connectDB = async () => {
	try {
		mongoose.set('strictQuery', false); // Set this explicitly to avoid the error

		await mongoose.connect(process.env.MONGO_URI, {});

		const db = mongoose.connection.db;

		if (!db) {
			console.error("Failed to get MongoDB database.");
			throw new Error("Failed to get MongoDB database.");
		}

		console.log(
			`MongoDB connected to ${mongoose.connection.host} with url: ${process.env.MONGO_URI}`
		);

		// Koleksiyonları kontrol et ve gerekiyorsa oluştur
		const collections = await db.collections();

		const existingCollections = collections.map(
			(collection) => collection.collectionName
		);
		const models = Object.keys(mongoose.models);
		const modelNames = models.map((model) => model.toLowerCase() + "s");

		for (const model of modelNames) {
			if (!existingCollections.includes(model)) {
				await db.createCollection(model);
				console.log(`Collection ${model} created.`);
			}
		}
	return true;
	} catch (error) {
		console.error("Error happened in db.js", error);
		process.exit(1);
	}
};

module.exports = connectDB;
