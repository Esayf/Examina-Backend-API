const { processQuestion } = require("../helpers/helperFunctions");
const Exam = require("../models/exam.model");
const Question = require("../models/Question");
const ParticipatedUser = require("../models/participatedUser.model");

async function create(examData, questions) {
	const newExam = new Exam({
		creator: examData.creator,
		title: examData.title,
		description: examData.description,
		startDate: examData.startDate,
		duration: examData.duration,
		rootHash: examData.rootHash,
		secretKey: examData.secretKey,
		questionCount: questions.length,
	});

	try {
		const savedExam = await newExam.save(); // Save exam to database

		const questionsWithPinnedLinks = await saveQuestions(
			questions,
			savedExam._id
		);

		return {
			message: "Exam created successfully",
			newExam: savedExam,
		};
	} catch (err) {
		console.error("Error saving exam:", err);
		throw new Error("Error when saving exam");
	}
}

async function saveQuestions(questions, examId) {
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
}

async function getAllByUser(userId) {
	try {
		const exams = await Exam.find({ creator: userId }).sort({
			startDate: -1,
		});
		return exams;
	} catch (err) {
		console.error("Error fetching exams:", err);
		throw new Error("Error fetching exams");
	}
}

async function getById(examId) {
	try {
		const exam = await Exam.findById(examId);
		return exam;
	} catch (error) {
		console.log(error);
		throw new Error("Error finding the exam");
	}
}

async function getByIdWithParticipation(examId, userId) {
	try {
		const exam = await getById(examId);

		const participation = await getParticipation(examId, userId);

		return {
			exam,
			isFinished: participation,
		};
	} catch (err) {
		console.error("Error fetching exam:", err);
		throw new Error("Error fetching exam");
	}
}

async function getParticipation(examId, userId) {
	// Unnecessary control. User id have to exist because it must pass authorization.
	// if (userId) {
	const userParticipation = await ParticipatedUser.findOne({
		user: userId,
		exam: examId,
	}).populate("user");

	if (!userParticipation) {
		return false; // User has not participated
	}

	return userParticipation.isFinished;
	// } else {
	// 	return { exam };
	// }
}

module.exports = { create, getAllByUser, getById, getByIdWithParticipation };
