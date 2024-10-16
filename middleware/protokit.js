const isTestEnv = require("./isTestEnv");
const Score = require("../models/Score");
const User = require("../models/user.model");
const Exam = require("../models/exam.model");
const createExam = async (examID, questions) => {
	if (process.env.NODE_ENV === "development") return;
	if (isTestEnv) return;
	const url = `${process.env.PROTOKIT_URL}/create/exam`;

	// Data to be sent in the POST request (can be JSON, FormData, etc.)
	const postData = {
		examID: examID.toString(),
		questions: questions,
	};
	console.log("postData: ", postData);

	// Options for the fetch request
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json", // Adjust content type as needed
		},
		body: JSON.stringify(postData), // Convert data to JSON string
	};

	// Making the POST request using fetch
	try {
		const response = await fetch(url, options);
		console.log("Create exam response: ", response);
		return response;
	} catch (error) {
		console.error("Error:", error);
		throw error;
	}
};

const submitAnswers = async (examID, userID, answers) => {
	if (process.env.NODE_ENV === "development") return;

	if (isTestEnv) return;
	const url = `${process.env.PROTOKIT_URL}/submit-user-answers`;
	const protokitAnswers = answers.map((answer) => {
		return {
			questionID: answer.questionID.toString(),
			answer: answer.answer,
		};
	});
	// Data to be sent in the POST request (can be JSON, FormData, etc.)
	const postData = {
		examID: examID.toString(),
		userID: userID.toString(),
		answers: protokitAnswers,
	};

	// Options for the fetch request
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json", // Adjust content type as needed
		},
		body: JSON.stringify(postData), // Convert data to JSON string
	};
	console.log("Submitting answers to protokit", postData);
	// Making the POST request using fetch
	return await fetch(url, options);
};

const publishCorrectAnswers = (examID, questionsWithCorrectAnswers) => {
	if (process.env.NODE_ENV === "development") return;

	if (isTestEnv) return;
	const url = `${process.env.PROTOKIT_URL}/publish-correct-answers`;

	// Data to be sent in the POST request (can be JSON, FormData, etc.)
	const postData = {
		examID: examID.toString(),
		questions: questionsWithCorrectAnswers,
	};

	// Options for the fetch request
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json", // Adjust content type as needed
		},
		body: JSON.stringify(postData), // Convert data to JSON string
	};

	// Making the POST request using fetch
	fetch(url, options)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			return response.json(); // Parsing JSON response
		})
		.then((data) => {
			console.log("Success:", data);
		})
		.catch((error) => {
			console.error("Error:", error);
		});
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkScore = async (examID, userID) => {
	if (process.env.NODE_ENV === "development") return 0;

	try {
		if (isTestEnv) return 0;
		const url = `${process.env.PROTOKIT_URL}/check-score`;

		// Data to be sent in the POST request (can be JSON, FormData, etc.)
		const postData = {
			examID: examID.toString(),
			userID: userID.toString(),
		};

		// Options for the fetch request
		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json", // Adjust content type as needed
			},
			body: JSON.stringify(postData), // Convert data to JSON string
		};
		console.log("Fetching score", postData);

		// Making the POST request using fetch
		const response = await fetch(url, options);
		const score = await response.json();
		console.log("Check score result: ", score);
		if (!score || score.score == "User score not found") {
			console.log("Waiting to get score");
			const user = await User.findOne({ uniqueId: userID });
			const exam = await Exam.findOne({ uniqueId: examID });
			let realScore = await getUserScore(examID, userID);
			console.log("Real score first try: ", realScore);
			for (let i = 0; i < 10; i++) {
				await delay(1000);
				console.log("Waiting for score...");
				if (realScore == "User score not found") {
					realScore = await getUserScore(examID, userID);
					console.log("Real score second try: ", realScore);
					if (realScore != "User score not found" && realScore >= 0) {
						const userScore = new Score({
							user: user._id,
							exam: exam._id,
							score: realScore,
						});
						await userScore.save();
						console.log("User score saved: ", userScore);
						console.log("User score: ", userScore.score);
						break;
					}
				} else {
					if (await Score.findOne({ user: user._id, exam: exam._id }))
						break;
					const userScore = new Score({
						user: user._id,
						exam: exam._id,
						score: realScore,
					});
					await userScore.save();
					console.log("User score saved: ", userScore);
					console.log("User score: ", userScore.score);
					break;
				}
			}
		}
		return "Score checked";
	} catch (error) {
		console.error("Error:", error);
		return "User score error";
	}
};

const getUserScore = async (examID, userID) => {
	if (process.env.NODE_ENV === "development") return 0;

	if (isTestEnv) return 0;
	const url = `${
		process.env.PROTOKIT_URL
	}/score/${examID.toString()}/${userID.toString()}`;

	// Making the POST request using fetch
	const response = await fetch(url);
	const score = await response.json();
	console.log("Score: ", score);
	return score.score;
};

module.exports = {
	createExam,
	submitAnswers,
	publishCorrectAnswers,
	checkScore,
	getUserScore,
};
