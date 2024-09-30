const Queue = require("bull");
const redisClient = require("../config/redis");
const ParticipatedUser = require("../models/ParticipatedUser");
const Score = require("../models/Score");
const Question = require("../models/Question");
const { getUserScore, checkScore } = require("../middleware/protokit");
const { sendExamResultEmail } = require("../mailer");

async function calculateScore(exam, user) {
	try {
		await delay(1000);
		console.log("Calculating score for exam: ", exam.title);
		console.log("Calculation score for User: ", user.email);
		console.log("Delayed for 1 second.");

		const result = await checkScore(exam.uniqueId, user.uniqueId);
		return result;
	} catch (error) {}
}
const examResultsQueue = new Queue("examResultsQueue", {
	createClient: function (type) {
		switch (type) {
			case "client":
				return redisClient;
			case "subscriber":
				return redisClient.duplicate();
			default:
				return redisClient;
		}
	},
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

examResultsQueue.process(1, async (job, done) => {
	try {
		const { participated } = job.data;
		const participatedUser = await ParticipatedUser.findById(
			participated._id
		);
		console.log("Processing job for participated user: ", participatedUser);
		console.log("Participated user id: ", participated?._id);
		if (!participatedUser) return done();
		if (!participated.user?.email) {
			console.log("User does not have email.");
			return done();
		}

		if (!participated.exam?.isCompleted) {
			console.log("Exam is not completed yet.");
			return done();
		}
		if (participatedUser.isMailSent) {
			console.log("Mail already sent to user.");
			return done();
		}

		let score = await Score.findOne({
			exam: participated.exam._id,
			user: participated.user._id,
		});

		if (!score || score.score === "User score not found") {
			await calculateScore(participated.exam, participated.user);
			await delay(1500);
			score = {
				score: await getUserScore(
					participated.exam.uniqueId,
					participated.user.uniqueId
				),
			};
		}

		await sendExamResultEmail(
			participated.user.email,
			participated.exam.title,
			participated.exam.questionCount,
			score.score
		);
		participatedUser.isMailSent = true;
		await participatedUser.save();
		done();
	} catch (error) {
		console.error("Error processing job: ", error);
		done(error);
	}
});

module.exports = examResultsQueue;
