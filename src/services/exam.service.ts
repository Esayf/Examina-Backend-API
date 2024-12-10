import { ExamDocument, QuestionInput, QuestionDocument, Answer, AnswerKey, ExtendedExamDocument } from "../types";
import Exam from "../models/exam.model";
import Question from "../models/question.model";
import participatedUserService from "./participatedUser.service";
import answerService from "./answer.service";
import { checkExamTimes, processQuestion, generatePasscodes, getWinnerlist } from "../helpers/helperFunctions";
import scoreService from "./score.service";
import Joi from "joi";
import { sendGeneratedExamLink } from "@/mailer";
import passcodeService from "./passcode.service";

interface ExamResult {
	status: number;
	message: string;
}

async function create(examData: Partial<ExamDocument>, questions: Array<QuestionInput>): Promise<ExamDocument> {
	try {
		const schema = Joi.object({
			title: Joi.string().required(),
			creator: Joi.string().required(),
			description: Joi.string().required(),
			startDate: Joi.date().required(),
			questions: Joi.array().required(),
			duration: Joi.number().required(),
			rootHash: Joi.string().optional(),
			secretKey: Joi.string().optional(),
			questionCount: Joi.number().required(),
			isRewarded: Joi.boolean(),
			isPrivate: Joi.boolean(),
			isWinnerlistRequested: Joi.boolean(),
			rewardPerWinner: Joi.when("isRewarded", {
				is: true,
				then: Joi.number().positive().required(),
				otherwise: Joi.optional(),
			}),
			passingScore: Joi.when("isRewarded", {
				is: true,
				then: Joi.number().min(1).max(100).required(),
				otherwise: Joi.optional(),
			}),
			deployJobId: Joi.when("isRewarded", {
				is: true,
				then: Joi.string().required(),
				otherwise: Joi.optional(),
			}),
			contractAddress: Joi.string().required(),
		});

		const { error } = schema.validate(examData);

		if (error) {
			throw new Error(error.details[0].message);
		}

		examData.isDistributed = false;
		const exam = new Exam(examData);
		const savedExam = await exam.save();

		await saveQuestions(questions, savedExam.id);

		return savedExam;
	} catch (error) {
		console.error("Error creating exam:", error);
		throw new Error("Error creating exam");
	}
}

async function saveQuestions(questions: QuestionInput[], examId: string): Promise<QuestionDocument[]> {
	try {
		// Process each question before saving
		const processedQuestions = await Promise.all(questions.map((question) => processQuestion(question)));

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

export type GeneratedLink = {
	email: string;
	link: string;
};

async function generateAndSendLinks(examId: string, emailList: string[]): Promise<GeneratedLink[]> {
	try {
		const passcodes = generatePasscodes(emailList.length);

		// Passcode ve link üretimi
		const links = await Promise.all(
			emailList.map(async (email, index) => {
				const link = `https://choz.io/app/exams/get-started/${examId}/${passcodes[index]}`;

				await passcodeService.create(examId, passcodes[index]);

				await sendGeneratedExamLink(link, email);

				return { email, link };
			})
		);
		return links;
	} catch (error) {
		console.error("Error generating or sending exam links:", error);
		throw new Error("Error generating or sending exam links");
	}
}

async function getAllByUser(userId: string): Promise<ExamDocument[]> {
	try {
		return await Exam.find({ creator: userId });
	} catch (error) {
		console.error("Error fetching exams:", error);
		throw new Error("Error fetching exams");
	}
}

async function getById(examId: string): Promise<ExtendedExamDocument | null> {
	try {
		let exam: ExtendedExamDocument | null = await Exam.findById(examId);
		const isExamActive = checkExamTimes(exam as ExamDocument);
		if (exam && !isExamActive.valid) {
			exam.winnerlist = await getWinnerlist(examId);
		}

		console.log("EXAM EXAM EXAM: ", exam);
		return exam as ExtendedExamDocument;
	} catch (error) {
		console.error("Error fetching exam:", error);
		throw new Error("Error fetching exam");
	}
}

async function start(examId: string, userId: string, passcode: string): Promise<ExamResult> {
	try {
		const exam = await getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		console.log("Exam: ", exam);
		if (exam.isPrivate) {
			const isPasscodeValid = await passcodeService.validate(passcode);
			if (!isPasscodeValid) {
				return { status: 400, message: "Invalid passcode" };
			}
		}

		const isExamActive = checkExamTimes(exam);
		if (!isExamActive.valid) {
			return {
				status: 400,
				message: isExamActive.message || "Invalid exam time",
			};
		}

		const participationResult = await participatedUserService.checkParticipation(userId, examId, {
			createIfNotExist: true,
		});

		return {
			status: participationResult.status,
			message: participationResult.message,
		};
	} catch (error) {
		console.error("Error starting exam:", error);
		throw new Error("Error starting exam");
	}
}

async function getAnswerKey(examId: string): Promise<AnswerKey[]> {
	// Verify the exam exists
	const exam = await Exam.findById(examId);
	if (!exam) {
		throw new Error("Exam not found");
	}

	// Fetch questions related to the exam, selecting question number and correct answer, and sort by question number
	const questions = await Question.find({ exam: examId })
		.select("number correctAnswer") // Select question number and correct answer
		.sort({ number: 1 }); // Sort by question number in ascending order

	// Create the answer key array
	const answerKey: AnswerKey[] = questions.map((question) => ({
		questionId: question.id,
		questionNumber: question.number,
		correctAnswer: question.correctAnswer,
	}));

	return answerKey;
}

async function finish(userId: string, examId: string, answers: Answer[], walletAddress: string): Promise<ExamResult> {
	try {
		const exam = await getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		const participationResult = await participatedUserService.checkParticipation(userId, examId, {
			createIfNotExist: false,
		});

		if (!participationResult.success) {
			return {
				status: participationResult.status,
				message: participationResult.message,
			};
		}

		await answerService.create(userId, examId, answers, walletAddress);

		const answerKey = await getAnswerKey(examId);

		// Calculate score
		const { score, correctAnswers } = await scoreService.calculateScore(answers, answerKey);

		console.log("Score: ", score);
		console.log("Correct Answers: ", correctAnswers);

		// Save the score
		await scoreService.createScore({
			user: userId,
			exam: examId,
			score: parseInt(score),
			totalQuestions: exam.questionCount,
			correctAnswers: correctAnswers,
		});

		// WINNER DETERMINATION
		const isWinner = parseInt(score) > exam.passingScore ? true : false;

		await participatedUserService.updateParticipationStatus(userId, examId, isWinner);

		return { status: 200, message: "Exam completed successfully" };
	} catch (error) {
		console.error("Error finishing exam:", error);
		throw new Error("Error finishing exam");
	}
}

export default {
	create,
	generateAndSendLinks,
	getAllByUser,
	getById,
	start,
	finish,
};
