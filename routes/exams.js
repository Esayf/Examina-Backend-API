const express = require("express");
const Exam = require("../models/Exam");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const User = require("../models/User");
const ParticipatedUser = require("../models/ParticipatedUser");
const Score = require("../models/Score");
const router = express.Router();
const crypto = require("crypto");
const { project_questions, map_questions } = require("../models/projections");
const isAuthenticated = require("../middleware/auth");
const {
	createExam,
	publishCorrectAnswers,
	submitAnswers,
	checkScore,
	getUserScore,
} = require("../middleware/protokit");
const isTestEnv = require("../middleware/isTestEnv");
const { setTimeout } = require("timers");
const axios = require("axios");
const cron = require("node-cron");
const Joi = require("joi");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
router.use((req, res, next) => {
	isAuthenticated(req, res, next);
});

const markdownLinkRegex = /\[(.*?)\]\((https?:\/\/\S+)\)/g;

// Regex to extract CID from the URL
const cidRegex = /\/ipfs\/(Qm[a-zA-Z0-9]{44}|baf[a-zA-Z0-9]{56})/;

// Pin to IPFS function
async function pinToIPFS(hash) {
	try {
		const response = await axios.post(
			"https://api.pinata.cloud/pinning/pinByHash",
			{
				hashToPin: hash,
				pinataMetadata: {
					name: "Pinned_Link",
				},
			},
			{
				headers: {
					pinata_api_key: process.env.PINATA_API_KEY,
					pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
				},
			}
		);
		console.log("SUCCESS: Pinned CID:", hash);
		return response.data.IpfsHash;
	} catch (error) {
		console.error("Error pinning to IPFS:", error);
		throw error;
	}
}

router.post("/create", async (req, res) => {
	try {
		const user = await User.findById(req.session.user.userId);
		console.log("USER: ", req.session.user.userId);
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		if (req.body.questions.length === 0) {
			return res
				.status(400)
				.json({ message: "Questions cannot be empty" });
		}

		const newExam = new Exam({
			creator: user._id,
			title: req.body.title,
			description: req.body.description,
			startDate: req.body.startDate,
			duration: req.body.duration,
			rootHash: req.body.rootHash,
			secretKey: req.body.secretKey,
			questionCount: req.body.questions.length,
		});

		console.log("Questions: ", req.body.questions);

		newExam
			.save()
			.then(async (result) => {
				const questionsWithPinnedLinksInserted = await Promise.all(
					req.body.questions.map(async (question) => {
						console.log("Processing Question: ", question.text);

						// Extract markdown links from question text
						const matches = [
							...question.text.matchAll(markdownLinkRegex),
						];
						for (const match of matches) {
							console.log("Found Markdown Link: ", match[1]);
							const url = match[1]; // Extracted URL from markdown link
							const cidMatch = url.match(cidRegex);

							if (cidMatch && cidMatch[1]) {
								const cid = cidMatch[1]; // Extracted CID from the URL
								try {
									await pinToIPFS(cid); // Pin CID to IPFS
								} catch (error) {
									console.error(`Failed to pin CID: ${cid}`);
								}
							} else {
								console.log(
									"No valid CID found in the URL:",
									url
								);
							}
						}

						// Process question options similarly if they exist
						if (
							question.options &&
							Array.isArray(question.options)
						) {
							console.log("Processing Options for Question.");
							question.options = await Promise.all(
								question.options.map(async (option) => {
									console.log(
										"Processing Option: ",
										option.text
									);
									const optionMatches = [
										...option.text.matchAll(
											markdownLinkRegex
										),
									];
									for (const match of optionMatches) {
										console.log(
											"Option Text Match: ",
											match[1]
										);
										const url = match[1];
										const cidMatch = url.match(cidRegex);

										if (cidMatch && cidMatch[1]) {
											const cid = cidMatch[1];
											try {
												await pinToIPFS(cid);
											} catch (error) {
												console.error(
													`Failed to pin CID: ${cid}`
												);
											}
										} else {
											console.log(
												"No valid CID found in the URL:",
												url
											);
										}
									}
									return option;
								})
							);
						}

						question.exam = newExam._id;
						return await new Question(question).save();
					})
				);
				console.log(result);
				console.log(
					"Inserted many questions",
					questionsWithPinnedLinksInserted
				);
				await createExam(
					newExam.uniqueId,
					questionsWithPinnedLinksInserted.map((q) => ({
						questionID: q.uniqueId.toString(),
						question: crypto
							.createHash("sha1")
							.update(q.text)
							.digest("hex"),
						correct_answer: q.correctAnswer,
					}))
				);
				res.status(200).json({
					message: "Exam created successfully",
					newExam: newExam,
				});
			})
			.catch((err) => {
				console.log(err);
				res.status(500).json({ message: "Error when saving exam" });
			});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/", async (req, res) => {
	try {
		const exams = await Exam.find({
			creator: req.session.user.userId,
		}).sort({
			startDate: -1,
		});
		res.json(exams);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

router.post("/create/mock_exam", async (req, res) => {
	try {
		if (!isMochaRunning && process.env.NODE_ENV === "development") {
			const result = await fetch(
				`${process.env.PROTOKIT_URL}/create/mock_exam`
			);
			console.log("Result: ", result);
			res.json(result);
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const exam = await Exam.findById(req.params.id);
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}
		if (req.session.user.userId) {
			const user = await ParticipatedUser.find({
				user: req.session.user.userId,
			}).populate("user");
			const result = {
				exam: exam,
				isFinished: user.isFinished,
			};
			res.status(200).json(result);
		} else {
			res.status(200).json(exam);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

router.post("/startExam", async (req, res) => {
	const { examId } = req.body;

	try {
		const user = await User.findById(req.session.user.userId);
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const userId = user;

		const exam = await Exam.findById(examId);
		if (!exam) {
			return res.status(500).json({ message: "Exam not found" });
		}

		const startTime = exam.startDate;
		console.log("Start time: ", startTime);
		const endTime = new Date(startTime.getTime() + exam.duration * 60000); // Convert duration from minutes to milliseconds

		const currentDateTime = new Date().getTime();
		console.log("Current time: ", currentDateTime);
		console.log("End time: ", endTime);
		console.log("Start time: ", startTime);
		if (currentDateTime < startTime.getTime()) {
			return res.status(400).json({
				message: "Exam has not started yet.",
			});
		}
		if (currentDateTime > endTime) {
			return res.status(400).json({
				message: "Exam has already ended.",
			});
		}

		let participatedUser = await ParticipatedUser.findOne({
			user: userId,
			exam: examId,
		});

		if (participatedUser) {
			if (participatedUser.isFinished) {
				return res.status(400).json({
					message:
						"User has already participated and finished the exam",
				});
			} else {
				return res.status(200).json({ message: "Continue the exam" });
			}
		} else {
			const newParticipatedUser = new ParticipatedUser({
				user: userId,
				exam: examId,
				isFinished: false,
			});
			await newParticipatedUser.save();

			res.status(200).json({
				message: "Exam participation updated successfully",
			});
		}
	} catch (error) {
		console.log("ERROR: ", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

router.get("/:id/question/:questionId", async (req, res) => {
	try {
		const exam = await Exam.findById(req.params.id);
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}
		const question = await Question.findById(req.params.questionId).select(
			project_questions
		);
		if (!question) {
			return res.status(404).json({ message: "Question not found" });
		}
		res.status(200).json(question);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/:id/questions", async (req, res) => {
	try {
		const user = await User.findById(req.session.user.userId);
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const userId = user._id;
		const examId = req.params.id;

		const exam = await Exam.findById(examId);
		if (!exam) {
			return res.status(500).json({ message: "Exam not found" });
		}

		const startTime = exam.startDate;
		console.log("Start time: ", startTime);
		const endTime = new Date(startTime.getTime() + exam.duration * 60000); // Convert duration from minutes to milliseconds

		const currentDateTime = new Date();
		if (currentDateTime < startTime) {
			return res.status(400).json({
				message: "Exam has not started yet.",
			});
		}
		if (currentDateTime > endTime) {
			return res.status(400).json({
				message: "Exam has already ended.",
			});
		}

		let participatedUser = await ParticipatedUser.findOne({
			user: userId,
			exam: examId,
		});

		if (!participatedUser) {
			return res
				.status(404)
				.json({ message: "User is not participated" });
		}
		if (participatedUser.isFinished) {
			return res
				.status(400)
				.json({ message: "User has already finished the exam" });
		}

		const questions = await Question.find(
			{ exam: exam._id },
			map_questions
		).sort({ number: 1 });

		res.status(200).json(questions);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/:id/answers", async (req, res) => {
	try {
		const exam = await Exam.findById(req.params.id);
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}
		if (exam.startDate > new Date()) {
			return res
				.status(400)
				.json({ message: "Exam has not started yet" });
		}

		const answers = await Answer.find({
			user: req.session.user.userId,
			exam: exam._id,
		}).populate("answers");
		res.status(200).json(answers);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/:id/answers/:answerId", async (req, res) => {
	try {
		const exam = await Exam.findById(req.params.id);
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}
		if (exam.startDate > new Date()) {
			return res
				.status(400)
				.json({ message: "Exam has not started yet" });
		}

		const answer = await Answer.findById(req.params.answerId);
		res.status(200).json(answer);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/allscores", async (req, res) => {
	try {
		const scores = await Score.find();
		res.status(200).json(scores);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error finding scores" });
	}
});

router.get("/allscores/protkit", async (req, res) => {
	try {
		const participatedUsers = await ParticipatedUser.find({
			isFinished: true,
		}).populate(["user", "exam"]);
		const scores = await Promise.all(
			participatedUsers.map(async (participated) => {
				return await getUserScore(
					participated.exam.uniqueId,
					participated.user.uniqueId
				);
			})
		);
		res.status(200).json(scores.data);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error finding scores" });
	}
});

router.get("/scores/:examId", async (req, res) => {
	try {
		const user = await User.findById(req.session.user.userId);
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const userId = user._id;
		const examId = req.params.examId;

		const exam = await Exam.findById(examId);
		if (exam.startDate > new Date()) {
			return res
				.status(400)
				.json({ message: "Exam has not started yet" });
		}
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}

		const creatorId = exam.creator.toString();
		if (userId === creatorId) {
			const scores = await Score.find({ exam: examId });
			return res.status(200).json(scores);
		} else {
			return res.status(403).json({ message: "Unauthorized access" });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error finding scores" });
	}
});

router.get("/scores/get_user_score/:examId", async (req, res) => {
	try {
		const user = await User.findById(req.session.user.userId);
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const userId = user._id;
		const examId = req.params.examId;

		const exam = await Exam.findById(examId);
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}

		const score = await Score.findOne({ exam: examId, user: userId });
		if (!score) {
			return res
				.status(404)
				.json({ message: "Score not found for this user" });
		}

		res.status(200).json(score);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error finding user score" });
	}
});

// Define the schema for request body validation
const finishExamSchema = Joi.object({
	examID: Joi.string().required(),
	answers: Joi.array()
		.items(
			Joi.object({
				questionID: Joi.string().required(),
				answer: Joi.any().required(),
			})
		)
		.required(),
});

router.post("/finishExam", async (req, res) => {
	// Validate the request body
	const { error } = finishExamSchema.validate(req.body);
	if (error) {
		return res.status(400).json({ message: error.details[0].message });
	}

	try {
		const user = await User.findById(req.session.user.userId);
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const exam = await Exam.findById(req.body.examID);
		if (!exam) {
			return res.status(500).json({ message: "Exam not found" });
		}

		const currentDateTime = new Date();
		if (!isExamActive(exam, currentDateTime)) {
			return res.status(400).json({
				message: "Exam is not active.",
			});
		}

		let participatedUser = await ParticipatedUser.findOne({
			user: user._id,
			exam: exam._id,
		});
		if (participatedUser.isFinished) {
			return res
				.status(400)
				.json({ message: "User has already finished the exam" });
		}

		if (!(await Answer.findOne({ user: user._id, exam: exam._id }))) {
			let userAnswers = new Answer({
				user: user._id,
				exam: exam._id,
				answers: generateAnswersArray(
					req.body.answers,
					user.walletAddress
				),
			});
			await userAnswers.save();
		}
		const protokitSubmitAnswers = await generateProtokitSubmitAnswers(
			req.body.answers
		);
		await submitAnswers(
			exam.uniqueId,
			user.uniqueId,
			protokitSubmitAnswers
		);

		participatedUser.isFinished = true;
		await participatedUser.save();

		res.status(200).json({
			message: "Exam finished and answers submitted successfully",
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Error finishing exam and submitting answers",
		});
	}
});

function isExamActive(exam, currentDateTime) {
	const startTime = exam.startDate;
	const endTime = new Date(startTime.getTime() + exam.duration * 60000);
	return currentDateTime >= startTime && currentDateTime <= endTime;
}

function generateAnswersArray(answers, walletAddress) {
	return answers.map((answer) => {
		const hashInput = walletAddress + JSON.stringify(answer.answer);
		const answerHash = crypto
			.createHash("sha256")
			.update(hashInput)
			.digest("hex");
		return {
			question: answer.questionID,
			selectedOption: answer.answer,
			answerHash: answerHash,
		};
	});
}

async function generateProtokitSubmitAnswers(answers) {
	return Promise.all(
		answers.map(async (answer) => {
			const question = await Question.findById(answer.questionID);
			return {
				questionID: question.uniqueId,
				answer: answer.answer,
			};
		})
	);
}

module.exports = router;

async function publishExamAnswers(exam) {
	const startTime = exam.startDate;
	const endTime = new Date(startTime.getTime() + exam.duration * 60000); // Convert duration from minutes to milliseconds
	if (new Date() >= endTime) {
		const questions = await Question.find({ exam: exam._id });
		publishCorrectAnswers(
			exam.uniqueId,
			questions.map((q) => {
				return {
					questionID: q.uniqueId,
					question: crypto
						.createHash("sha1")
						.update(q.text)
						.digest("hex"),
					correct_answer: q.correctAnswer,
				};
			})
		);
	}
}

cron.schedule("*/2 * * * *", async () => {
	try {
		console.log("Running cron job");
		const now = new Date();
		const exams = await Exam.find({ isCompleted: false });
		if (!exams || exams.length === 0) {
			console.log("No exams found in cron job.");
			return;
		}
		const completedExams = exams.filter((exam) => {
			const startDate = new Date(exam.startDate);
			const endDate = new Date(
				startDate.getTime() + exam.duration * 60 * 1000
			);
			console.log(
				`Sinav: ${exam.title}, EndDate: ${endDate}, Now: ${now}`
			);
			return endDate <= now;
		});
		console.log("Completed Exams: ", completedExams);
		if (completedExams.length == 0) {
			console.log("No completed exams found.");
		} else {
			for (const exam of completedExams) {
				await delay(500);
				await publishExamAnswers(exam);
				console.log("Delayed for 1/2 second.");

				exam.isCompleted = true;
				await exam.save();
			}
		}
	} catch (error) {
		console.error("Error publishing exam answers: ", error);
	}
});

module.exports = router;
