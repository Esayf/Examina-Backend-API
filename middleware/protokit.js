const isTestEnv = require("./isTestEnv");
const createExam = (examID, questions) => {
	if (isTestEnv) return;
	const url = `${process.env.PROTOKIT_URL}/create/exam`;

	// Data to be sent in the POST request (can be JSON, FormData, etc.)
	const postData = {
		examID: examID.toString("hex"),
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
		});
};

const submitAnswer = async (examID, userID, questionID, userAnswer) => {
	if (isTestEnv) return;
	const url = `${process.env.PROTOKIT_URL}/submit-user-answer`;

	// Data to be sent in the POST request (can be JSON, FormData, etc.)
	const postData = {
		examID: examID.toString("hex"),
		userID: userID.toString("hex"),
		questionID: questionID.toString("hex"),
		userAnswer: userAnswer,
	};

	// Options for the fetch request
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json", // Adjust content type as needed
		},
		body: JSON.stringify(postData), // Convert data to JSON string
	};
	console.log("Submitting answer to protokit", postData);
	// Making the POST request using fetch
	return await fetch(url, options);
};

const publishCorrectAnswers = (examID, questionsWithCorrectAnswers) => {
	if (isTestEnv) return;
	const url = `${process.env.PROTOKIT_URL}/publish-correct-answers`;

	// Data to be sent in the POST request (can be JSON, FormData, etc.)
	const postData = {
		examID: examID.toString("hex"),
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

const checkScore = async (examID, userID, questionsWithCorrectAnswers) => {
	if (isTestEnv) return 0;
	const url = `${process.env.PROTOKIT_URL}/check-score`;

	// Data to be sent in the POST request (can be JSON, FormData, etc.)
	const postData = {
		examID: examID.toString("hex"),
		userID: userID.toString("hex"),
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
	console.log("Fetching score", postData);

	// Making the POST request using fetch
	const response = await fetch(url, options);
	const score = await response.json();
	console.log("Check score result: ", score);
	if (score.score == "User score not found") {
		await checkScore(examID, userID, questionsWithCorrectAnswers);
	}
	return score;
};

const getUserScore = async (examID, userID) => {
	if (isTestEnv) return 0;
	const url = `${process.env.PROTOKIT_URL}/score/${examID}/${userID}`;

	// Making the POST request using fetch
	const response = await fetch(url);
	const score = await response.json();
	console.log("Score: ", score);
	return score;
};

module.exports = {
	createExam,
	submitAnswer,
	publishCorrectAnswers,
	checkScore,
	getUserScore,
};
