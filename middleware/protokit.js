const isTestEnv = require("./isTestEnv");
const Score = require("../models/Score");
const User = require("../models/User");
const Exam = require("../models/Exam");
const { set } = require("mongoose");
const createExam = (examID, questions) => {
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
	fetch(url, options)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			return response; // Parsing JSON response
		})
		.then((data) => {
			console.log("Success:", data);
		})
		.catch((error) => {
			console.error("Error:", error);
			throw new Error("Error in protokit.js when creating Exam", error);
		});
};

const submitAnswers = async (examID, userID, answers) => {
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

const checkScore = async (examID, userID) => {
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
	if (score.score == "User score not found") {
		setTimeout(async () => {
			console.log("Waiting to get score");
			const user = await User.findOne({ uniqueId: userID });
			const exam = await Exam.findOne({ uniqueId: examID });
			let realScore = await getUserScore(examID, userID);
			console.log("Real score first try: ", realScore);
			if (realScore == 0 || realScore == "User score not found") {
				setTimeout(async () => {
					realScore = await getUserScore(examID, userID);
					console.log("Real score second try: ", realScore);
					const userScore = new Score({
						user: user._id,
						exam: exam._id,
						score: realScore > 0 ? realScore : 0,
					});
					await userScore.save();
					console.log("User score saved: ", userScore);
					console.log("User score: ", userScore.score);
				}, 2000);
			}
			else{
			const userScore = new Score({
				user: user._id,
				exam: exam._id,
				score: realScore > 0 ? realScore : 0,
			});
			await userScore.save();
			console.log("User score saved: ", userScore);
			console.log("User score: ", userScore.score);
		}
		}, 2000);
	} else {
		return score.score;
	}
};

const getUserScore = async (examID, userID) => {
	if (isTestEnv) return 0;
	const url = `${process.env.PROTOKIT_URL
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
