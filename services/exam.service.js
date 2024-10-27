const {
	processQuestion,
	checkExamTimes,
} = require("../helpers/helperFunctions");
const Exam = require("../models/exam.model");
const Question = require("../models/question.model");
const participatedUserService = require("./participatedUser.service");
const answerService = require("./answer.service");

async function create(examData, questions) {
	const newExam = new Exam({
		creator: examData.creator,
		title: examData.title,
		description: examData.description,
		duration: examData.duration,
		startDate: examData.startDate,
		rootHash: examData.rootHash,
		secretKey: examData.secretKey,
		questionCount: questions.length,
	});

	console.log("New Exam: ", newExam);

	try {
		const savedExam = await newExam.save(); // Save exam to database

		await saveQuestions(questions, savedExam._id);

		return {
			message: "Exam created successfully",
			newExam: savedExam,
		};
	} catch (error) {
		console.error("Error saving exam:", error);
		throw new Error("Error saving exam");
	}
}

async function saveQuestions(questions, examId) {
	try {
		// Process each question before saving
		const processedQuestions = await Promise.all(
			questions.map((question) => processQuestion(question))
		);

		// Save each processed question with a reference to the exam
		const savedQuestions = await Promise.all(
			processedQuestions.map((question) => {
				question.exam = examId;
				return new Question(question).save();
			})
		);

		return savedQuestions;
	} catch (error) {
		console.error("Error saving questions:", error);
		throw new Error("Error saving questions");
	}
}

async function getAllByUser(userId) {
	try {
		const exams = await Exam.find({ creator: userId }).sort({
			startDate: -1,
		});
		return exams;
	} catch (error) {
		console.error("Error fetching exams:", error);
		throw new Error("Error fetching exams");
	}
}

async function getById(examId) {
	try {
		const exam = await Exam.findById(examId);
		return exam;
	} catch (error) {
		console.log("Error fetching exam:", error);
		throw new Error("Error fetching exam");
	}
}

async function getByIdWithOrWithoutParticipation(examId, userId) {
	try {
		const exam = await getById(examId);

		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		if (userId) {
			const participation = await participatedUserService.get(
				examId,
				userId
			);

			if (!participation) {
				return { status: 404, message: "Participation not found" };
			}

			return {
				status: 200,
				message: "Exam and participation fetched successfully",
				data: {
					exam,
					isFinished: participation
						? participation.isFinished
						: false,
				},
			};
		}

		return {
			status: 200,
			message: "Exam fetched successfully",
			data: { exam },
		};
	} catch (error) {
		console.error("Error fetching exam:", error);
		throw new Error("Error fetching exam");
	}
}

async function start(examId, userId) {
	try {
		const exam = await getById(examId);

		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		// Check exam times
		const examTimeCheck = checkExamTimes(exam);
		if (!examTimeCheck.valid) {
			return { status: 400, message: examTimeCheck.message };
		}

		// Check or create participation
		const response = await participatedUserService.checkParticipation(
			userId,
			examId,
			{ createIfNotExist: true }
		);

		return response;
	} catch (error) {
		console.log("Error starting exam: ", error);
		throw new Error("Error starting exam");
	}
}

async function finish(userId, examId, answers, walletAddress) {
	try {
		const exam = await getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		const examTimeCheck = checkExamTimes(exam);
		if (!examTimeCheck.valid) {
			return { status: 400, message: examTimeCheck.message };
		}

		const participationResult =
			await participatedUserService.checkParticipation(userId, examId, {
				createIfNotExist: false,
			});

		if (!participationResult.success) {
			return {
				status: participationResult.status,
				message: participationResult.message,
			};
		}

		let answer = await answerService.get(userId, examId);

		if (!answer) {
			answer = await answerService.create(
				userId,
				examId,
				answers,
				walletAddress
			);
		}

		await participatedUserService.updatePariticipationStatus(
			userId,
			examId
		);

		return {
			status: 200,
			message: "Exam finished and answers submitted successfully",
		};
	} catch (error) {
		console.log("Error finishing exam: ", error);
		throw new Error("Error finishing exam");
	}
}

module.exports = {
	create,
	getAllByUser,
	getById,
	getByIdWithOrWithoutParticipation,
	start,
	finish,
};
