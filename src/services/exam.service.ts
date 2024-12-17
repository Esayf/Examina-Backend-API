import { ExamDocument, QuestionInput, QuestionDocument, Answer, AnswerKey, ExtendedExamDocument } from "../types";
import Exam from "../models/exam.model";
import Question from "../models/question.model";
import ParticipatedUser from "@/models/participatedUser.model";
import User from "@/models/user.model";
import participatedUserService from "./participatedUser.service";
import answerService from "./answer.service";
import { checkExamTimes, processQuestion, generatePasscodes } from "../helpers/helperFunctions";
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
			isRewarded: Joi.boolean(),
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
			contractAddress: Joi.string().optional(),
		});
		const { error } = schema.validate({
			isRewarded: examData.isRewarded,
			rewardPerWinner: examData.rewardPerWinner,
			passingScore: examData.passingScore,
			deployJobId: examData.deployJobId,
			contractAddress: examData.contractAddress,
		});
		if (error) {
			throw new Error(error.details[0].message);
		}

		examData.isDistributed = false;
		const exam = new Exam(examData);
		const savedExam = await exam.save();

		await saveQuestions(questions, savedExam.id);

		return savedExam;
	} catch (error) {
		console.error("Error creating exam: ", error);
		throw new Error("Error creating exam");
	}
}

export type GeneratedLink = {
	email: string;
	link: string;
};

async function generateAndSendLinks(examId: string, emailList: string[]): Promise<GeneratedLink[]> {
	try {
		const passcodes = generatePasscodes(emailList.length);

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
		console.error("Error generating or sending exam links: ", error);
		throw new Error("Error generating or sending exam links");
	}
}

async function getAllByUser(userId: string): Promise<ExamDocument[]> {
	try {
		return await Exam.find({ creator: userId }).sort({ createdAt: "desc" });
	} catch (error) {
		console.error("Error fetching exams: ", error);
		throw new Error("Error fetching exams");
	}
}

async function getById(examId: string): Promise<ExamDocument | null> {
	try {
		const exam = await Exam.findById(examId);
		return exam;
	} catch (error) {
		console.error("Error fetching exam: ", error);
		throw new Error("Error fetching exam");
	}
}

async function getDetails(examId: string): Promise<ExtendedExamDocument | null> {
	try {
		let exam: ExtendedExamDocument | null = await Exam.findById(examId);
		if (exam && exam.isCompleted) {
			let examObject = exam.toObject();
			if (exam.isRewarded) {
				const winnerlist: string[] = await getWinnerlist(exam._id);
				examObject.winnerlist = winnerlist;
			}
			// TODO: Leaderboard Feature
			console.log("EXAM EXAM EXAM: ", examObject);
			return examObject as ExtendedExamDocument;
		}
		return exam as ExtendedExamDocument;
	} catch (error) {
		console.error("Error fetching exam details: ", error);
		throw new Error("Error fetching exam details");
	}
}

async function start(examId: string, userId: string, passcode: string): Promise<ExamResult> {
	try {
		const exam = await getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

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
		console.error("Error starting exam: ", error);
		throw new Error("Error starting exam");
	}
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

		const { score, correctAnswers } = await scoreService.calculateScore(answers, answerKey);

		console.log("Score: ", score);
		console.log("Correct Answers: ", correctAnswers);

		await scoreService.createScore({
			user: userId,
			exam: examId,
			score: parseInt(score),
			totalQuestions: exam.questionCount,
			correctAnswers: correctAnswers,
		});

		// WINNER DETERMINATION
		const isWinner = exam.isRewarded ? parseInt(score) > (exam.passingScore || 0) : false;

		await participatedUserService.updateParticipationStatus(userId, examId, isWinner);

		return { status: 200, message: "Exam completed successfully" };
	} catch (error) {
		console.error("Error finishing exam: ", error);
		throw new Error("Error finishing exam");
	}
}

//////////////////////////////////////
// 		 Auxiliary Functions		//
//////////////////////////////////////

async function saveQuestions(questions: QuestionInput[], examId: string): Promise<QuestionDocument[]> {
	try {
		const processedQuestions = await Promise.all(questions.map((question) => processQuestion(question)));

		const savedQuestions = await Promise.all(
			processedQuestions.map((question) => {
				question.exam = examId;
				return new Question(question).save();
			})
		);

		return savedQuestions;
	} catch (error) {
		console.error("Error saving questions: ", error);
		throw new Error("Error saving questions");
	}
}

async function getAnswerKey(examId: string): Promise<AnswerKey[]> {
	const exam = await Exam.findById(examId);
	if (!exam) {
		throw new Error("Exam not found");
	}

	const questions = await Question.find({ exam: examId }).select("number correctAnswer").sort({ number: 1 });

	const answerKey: AnswerKey[] = questions.map((question) => ({
		questionId: question.id,
		correctAnswer: question.correctAnswer,
	}));

	return answerKey;
}

type WinnerlistResult = {
	walletAddress: string;
};

async function getWinnerlist(examId: string): Promise<string[]> {
	const pipeline = [
		{
			$match: {
				exam: examId,
				isFinished: true,
				isWinner: true,
			},
		},
		{
			$lookup: {
				from: "users", // İlişkilendirilecek koleksiyonun adı (User koleksiyonu)
				localField: "user", // `ParticipatedUser` koleksiyonundaki referans alanı
				foreignField: "_id", // `User` koleksiyonundaki referanslanan alan
				as: "userDetails", // Yeni oluşturulacak alan
			},
		},
		{
			$unwind: "$userDetails", // userDetails dizisini düzleştir
		},
		{
			$match: {
				"userDetails.walletAddress": { $ne: null }, // Cüzdan adresi olmayanları hariç tut
			},
		},
		{
			$project: {
				walletAddress: "$userDetails.walletAddress", // Sadece walletAddress'i seç
			},
		},
	];

	const result = await ParticipatedUser.aggregate(pipeline);
	return result.map((doc: WinnerlistResult) => doc.walletAddress);
}

export default {
	create,
	generateAndSendLinks,
	getAllByUser,
	getById,
	getDetails,
	start,
	finish,
	getWinnerlist,
};
