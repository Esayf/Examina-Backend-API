const express = require("express");
const dotenv = require("dotenv");
var cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const compression = require("compression");
const path = require("path");
const session = require("express-session");
var MongoDBStore = require("connect-mongodb-session")(session);
const MemoryStore = require("memorystore")(session);

dotenv.config({ path: "./.env" });
const isTestEnv = require("./middleware/isTestEnv");
const app = express();
setTimeout(() => {
	try {
		connectDB();
		app.use(compression());

		app.use(express.static(path.join(__dirname, "public")));

		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));
		var sess = {
			secret: "examina the best",
			cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 },
			resave: false,
			saveUninitialized: true,
		};
		var store = process.env.NODE_ENV === "test"
			? new MemoryStore({
					checkPeriod: 86400000, // prune expired entries every 24h
			  })
			: new MongoDBStore({
					uri: `${process.env.MONGO_URI}/connect_mongodb_session_test`,
					collection: "mySessions",
			  });
		// Catch errors
		store.on("error", function (error) {
			console.log(error);
		});

		sess.store = store;

		app.use(
			cors({
				origin: [
					"http://localhost:3000",
					"http://localhost:3001",
					"https://www.choz.io",
					"http://localhost:8081",
					"https://choz.io",
					"https://choz.io/",
					"https://www.choz.io/",
				],
				credentials: true,
			})
		);
		app.set("trust proxy", 1); // trust first proxy;

		// if (!isTestEnv) {
		// 	sess.store = store;
		// }

		app.use(session(sess));
		if (process.env.NODE_ENV === "development") {
			app.use(morgan("dev"));
		}

		app.use("/exams", require("./routes/exams"));
		app.use("/register", require("./routes/register"));
		app.use("/user", require("./routes/user"));
		app.use("/questions", require("./routes/questions"));
	} catch (error) {
		console.log("Error from appjs: ", error);
		throw new Error("Logged Error in app.js", error);
	}
}, 5000);

module.exports = app;
