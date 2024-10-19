const {
	processQuestion,
	checkExamTimes,
} = require("../helpers/helperFunctions");
const Exam = require("../models/exam.model");
const Question = require("../models/Question");
const participatedUserService = require("./participatedUser.service");
const questionService = require("../services/question.service");
const { map_questions } = require("../models/projections");

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

		await saveQuestions(questions, savedExam._id);

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
		throw new Error("Exam not found");
	}
}

async function getByIdWithOrWithoutParticipation(examId, userId) {
	try {
		const exam = await getById(examId);

		if (userId) {
			const participation = await participatedUserService.get(
				examId,
				userId
			);

			return {
				exam,
				isFinished: participation ? participation.isFinished : false,
			};
		} else {
			return exam;
		}
	} catch (err) {
		console.error("Error fetching exam:", err);
		throw new Error("Error fetching exam");
	}
}

async function start(examId, userId) {
	try {
		const exam = await getById(examId);

		// Sınav zamanı kontrolü
		const examTimeCheck = checkExamTimes(exam);
		if (!examTimeCheck.valid) {
			return { status: 400, message: examTimeCheck.message };
		}

		// Katılımcı kullanıcıyı kontrol et
		return await participatedUserService.checkParticipation(
			userId,
			examId,
			{
				createIfNotExist: true,
			}
		);
	} catch (error) {
		console.log("Error starting exam: ", error);
		return { status: 500, message: "Internal Server Error" };
	}
}

// This function should move to question.service. It would be better.
// These controls should be inside service or controller? Which one is more proper?
async function getQuestionsByExam(examId, userId) {
	try {
		const exam = await getById(examId);

		// Check if the exam has started or ended
		const examTimeCheck = checkExamTimes(exam);
		if (!examTimeCheck.valid) {
			return { status: 400, message: examTimeCheck.message };
		}

		// Check if the user has participated
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

		// Retrieve the questions for the exam
		const questions = await questionService.getAllByExam(examId);

		return { status: 200, data: questions };
	} catch (err) {
		console.error("Error fetching exam questions:", err);
		throw { status: 500, message: "Internal Server Error" };
	}
}

module.exports = {
	create,
	getAllByUser,
	getById,
	getByIdWithOrWithoutParticipation,
	start,
	getQuestionsByExam,
};
