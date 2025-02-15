import {
	ExamDocument,
	QuestionInput,
	QuestionDocument,
	Answer,
	AnswerKey,
	ExtendedExamDocument,
	Winner,
	Participant,
	Leaderboard,
} from "@/typings";
import { ExamSessionDocument } from "@/models/examSession.model";
import Exam from "../models/exam.model";
import Question from "../models/question.model";
import ParticipatedUser from "@/models/participatedUser.model";
import Score from "@/models/score.model";
import participatedUserService from "./participatedUser.service";
import answerService from "./answer.service";
import { checkExamTimes, processQuestion, generatePasscodes } from "../helpers/helperFunctions";
import scoreService from "./score.service";
import Joi from "joi";
import { sendGeneratedExamLink } from "@/mailer";
import passcodeService from "./passcode.service";
import mongoose from "mongoose";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/utils/errors";
import { ExamSessionService } from "./examSession.service";

const examSessionService = new ExamSessionService();

interface ExamResult {
	status: number;
	message: string;
}

async function create(examData: Partial<ExamDocument>, questions: Array<QuestionInput>): Promise<ExamDocument> {
	try {
		examData.isDistributed = false;

		// Set default values for flexible exam
		if (examData.isFlexible) {
			examData.status = "passive";
			if (!examData.participantTimeLimit) {
				throw new BadRequestError("Participant time limit is required for flexible exams");
			}
		}

		const exam = new Exam(examData);
		const savedExam = await exam.save();

		await saveQuestions(questions, savedExam.id);

		return savedExam;
	} catch (error) {
		console.error("Error creating exam: ", error);
		throw error;
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

export type SortFields = "title" | "startDate" | "duration" | "createdAt" | "score" | "endDate" | "status";

interface ExamWithScore extends Omit<ExamDocument, "status"> {
	score?: number;
	endDate: Date;
	status?: "upcoming" | "active" | "ended" | "passive" | "completed"; // Combined status types
}

export async function getAllByUser(
	userId: string,
	role: string,
	filter: string,
	sortBy?: SortFields,
	sortOrder?: "asc" | "desc"
): Promise<ExamWithScore[]> {
	try {
		let exams: ExamWithScore[];

		// role filtering
		if (role === "created") {
			exams = await Exam.find({ creator: new mongoose.Types.ObjectId(userId) });
		} else if (role === "joined") {
			const participated = await ParticipatedUser.find({ user: userId }).select("exam");
			const examIds = participated.map((p) => new mongoose.Types.ObjectId(p.exam.toString()));
			exams = await Exam.find({ _id: { $in: examIds } });

			// score sorting
			if (sortBy === "score") {
				const scores = await Score.find({
					user: new mongoose.Types.ObjectId(userId),
					exam: { $in: examIds },
				}).select("exam score");
				const scoreMap = new Map<string, number>();

				scores.forEach((score) => {
					scoreMap.set(score.exam.toString(), score.score);
				});

				exams = exams.map((exam) => ({
					...exam.toObject(),
					score: scoreMap.get((exam._id as mongoose.Types.ObjectId).toString()) || null,
				})) as ExamWithScore[];
			}
		} else {
			throw new Error("Invalid role: Role must be 'created' or 'joined'.");
		}

		const now = new Date();

		// EndDate ve status hesaplama
		exams = exams.map((exam) => {
			const endDate = new Date(new Date(exam.startDate).getTime() + exam.duration * 60000); // startDate + duration

			// Durum belirleme (status)
			let status: string;
			if (new Date(exam.startDate) > now) {
				status = "upcoming";
			} else if (new Date(exam.startDate) <= now && endDate >= now) {
				status = "active";
			} else {
				status = "ended";
			}

			return {
				...exam.toObject(),
				endDate,
				status,
			} as ExamWithScore;
		});

		// Filtreleme işlemi
		if (filter !== "all") {
			exams = exams.filter((exam) => {
				if (filter === "upcoming") {
					return exam.status === "upcoming";
				} else if (filter === "active") {
					return exam.status === "active";
				} else if (filter === "ended") {
					return exam.status === "ended";
				}
				return true;
			});
		}

		// Varsayılan sıralama ayarla
		const finalSortBy: SortFields = sortBy || "createdAt";
		const finalSortOrder: "asc" | "desc" = sortOrder || "desc";

		// Sıralama uygulama
		exams.sort((a, b) => {
			let fieldA, fieldB;

			if (finalSortBy === "status") {
				// Status sıralamasını numeric hale getir
				const statusOrder: { [key in "upcoming" | "active" | "ended"]: number } = {
					upcoming: 1,
					active: 2,
					ended: 3,
				};

				fieldA = statusOrder[a.status as "upcoming" | "active" | "ended"];
				fieldB = statusOrder[b.status as "upcoming" | "active" | "ended"];
			} else if (finalSortBy === "endDate") {
				fieldA = finalSortBy === "endDate" ? a.endDate : a[finalSortBy as keyof ExamWithScore];
				fieldB = finalSortBy === "endDate" ? b.endDate : b[finalSortBy as keyof ExamWithScore];

				if (!fieldA) fieldA = finalSortBy === "endDate" ? new Date(0) : "";
				if (!fieldB) fieldB = finalSortBy === "endDate" ? new Date(0) : "";
			}

			if (fieldA instanceof Date) fieldA = fieldA.getTime();
			if (fieldB instanceof Date) fieldB = fieldB.getTime();

			if (typeof fieldA === "string" && typeof fieldB === "string") {
				const comparison = fieldA.localeCompare(fieldB, "en", { sensitivity: "base" });
				return finalSortOrder === "asc" ? comparison : -comparison;
			}

			return finalSortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
		});

		return exams;
	} catch (error) {
		console.error("Error fetching exams by user: ", error);
		throw new Error("Error fetching exams by user");
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
		if (!exam) return null;

		let examObject = exam.toObject();
		console.log("EXAM OBJECT: ", examObject);
		const participants: Participant[] = await getParticipants(exam._id);
		examObject.participants = participants;
		console.log("PARTICIPANTS: ", participants);

		if (exam.isCompleted) {
			// TODO: Leaderboard Feature
			const leaderboard = getLeaderboard(participants);
			console.log("LEADERBOARD: ", leaderboard);
			examObject.leaderboard = leaderboard;

			if (exam.isRewarded) {
				const winnerlist: Winner[] = await getWinnerlist(exam.id);
				console.log("WINNERLIST: ", winnerlist);
				examObject.winnerlist = winnerlist;
			}
		}

		console.log("EXAM EXAM EXAM: ", examObject);
		return examObject as ExtendedExamDocument;
	} catch (error) {
		console.error("Error fetching exam details: ", error);
		throw new Error("Error fetching exam details");
	}
}

async function updateExamStatus(
	examId: string,
	userId: string,
	newStatus: "active" | "passive"
): Promise<ExamDocument> {
	const exam = await Exam.findById(examId);
	if (!exam) {
		throw new NotFoundError("Exam not found");
	}

	// Only creator can change status
	if (exam.creator.toString() !== userId) {
		throw new ForbiddenError("Only exam creator can change exam status");
	}

	// Only flexible exams can have their status changed
	if (!exam.isFlexible) {
		throw new BadRequestError("Only flexible exams can have their status changed");
	}

	// Cannot reactivate completed exam
	if (exam.status === "completed") {
		throw new BadRequestError("Cannot change status of completed exam");
	}

	exam.status = newStatus;
	return await exam.save();
}

async function start(examId: string, userId: string, passcode: string, nickname: string | null): Promise<ExamResult> {
	try {
		let randomNickname = nickname || (await participatedUserService.generateRandomNickname(examId));
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

		// Handle flexible exam validation
		if (exam.isFlexible) {
			if (exam.status !== "active") {
				return { status: 400, message: "This exam is not currently active" };
			}
		} else {
			// For non-flexible exams, check the usual time constraints
			const isExamActive = checkExamTimes(exam);
			if (!isExamActive.valid) {
				return {
					status: 400,
					message: isExamActive.message || "Invalid exam time",
				};
			}
		}

		const participationResult = await participatedUserService.checkParticipation(userId, examId, randomNickname, {
			createIfNotExist: true,
		});

		// If participation is successful and exam is flexible, create a session
		if (participationResult.status === 200 && exam.isFlexible) {
			await examSessionService.startSession(examId, userId);
		}

		return {
			status: participationResult.status,
			message: participationResult.message,
		};
	} catch (error) {
		console.error("Error starting exam: ", error);
		throw error;
	}
}

async function finish(userId: string, examId: string, answers: Answer[], walletAddress: string): Promise<ExamResult> {
	try {
		const exam = await getById(examId);
		if (!exam) {
			return { status: 404, message: "Exam not found" };
		}

		// For flexible exams, check and complete the session
		if (exam.isFlexible) {
			const session = (await examSessionService.getActiveSession(examId, userId)) as ExamSessionDocument;
			if (!session) {
				return { status: 400, message: "No active session found for this exam" };
			}
			if (session.remainingTime <= 0) {
				return { status: 400, message: "Exam session has expired" };
			}
			await examSessionService.completeSession((session._id as mongoose.Types.ObjectId).toString());
		}

		const participationResult = await participatedUserService.checkParticipation(userId, examId, "", {
			createIfNotExist: false,
		});

		if (!participationResult.success) {
			return {
				status: participationResult.status,
				message: participationResult.message,
			};
		}

		await answerService.create(userId, examId, answers, walletAddress);

		const answerKey: AnswerKey[] = await getAnswerKey(examId);
		const { score, correctAnswers } = await scoreService.calculateScore(answers, answerKey);

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
		throw error;
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

	const questions = await Question.find({ exam: examId })
		.select("number correctAnswer difficulty")
		.sort({ number: 1 });

	const answerKey: AnswerKey[] = questions.map((question) => ({
		questionId: question.id,
		correctAnswer: question.correctAnswer,
		difficulty: question.difficulty,
	}));

	return answerKey;
}

async function getWinnerlist(examId: string): Promise<
	{
		walletAddress: string;
		score: number;
		finishTime: Date;
	}[]
> {
	const pipeline: any[] = [
		// 1. Convert examId string to ObjectId and filter winners
		{
			$match: {
				exam: new mongoose.Types.ObjectId(examId),
				isFinished: true,
				isWinner: true,
			},
		},
		// 2. Lookup users with proper ObjectId handling
		{
			$lookup: {
				from: "users",
				let: { userId: "$user" },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ["$_id", "$$userId"] },
						},
					},
				],
				as: "userDetails",
			},
		},
		{
			$unwind: "$userDetails",
		},
		// 3. Lookup scores with proper ObjectId handling
		{
			$lookup: {
				from: "scores",
				let: { userId: "$user", examId: "$exam" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [{ $eq: ["$user", "$$userId"] }, { $eq: ["$exam", "$$examId"] }],
							},
						},
					},
				],
				as: "scoreDetails",
			},
		},
		{
			$unwind: {
				path: "$scoreDetails",
				preserveNullAndEmptyArrays: true,
			},
		},
		// 4. Filter for users with wallet addresses
		{
			$match: {
				"userDetails.walletAddress": { $exists: true, $ne: null },
			},
		},
		// 5. Project final results
		{
			$project: {
				_id: 0,
				walletAddress: "$userDetails.walletAddress",
				score: { $ifNull: ["$scoreDetails.score", 0] },
				finishTime: 1,
			},
		},
		// 6. Sort by score and finish time
		{
			$sort: {
				score: -1,
				finishTime: 1,
			},
		},
	];

	const result = await ParticipatedUser.aggregate(pipeline);
	return result;
}

async function getParticipants(examId: string): Promise<Participant[]> {
	const pipeline: any[] = [
		// 1. Sınavı ve bitmiş olanları filtrele
		{
			$match: {
				exam: examId,
				// isFinished: true,
			},
		},
		// 2. User koleksiyonundan kullanıcı detaylarını al
		{
			$lookup: {
				from: "users", // User koleksiyonu adı
				localField: "user", // ParticipatedUser'daki user alanı
				foreignField: "_id", // User koleksiyonundaki referans alanı
				as: "userDetails", // Yeni oluşturulacak alan
			},
		},
		{
			$unwind: "$userDetails", // userDetails dizisini düzleştir
		},
		// 3. Score koleksiyonundan o kullanıcının skoru
		{
			$lookup: {
				from: "scores", // Score koleksiyonu adı
				let: { userId: "$user", examId: "$exam" }, // Kullanıcı ve sınav referansı
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $eq: ["$user", "$$userId"] }, // Score.user == ParticipatedUser.user
									{ $eq: ["$exam", "$$examId"] }, // Score.exam == ParticipatedUser.exam
								],
							},
						},
					},
					{ $project: { _id: 0, score: 1 } }, // Sadece score alanını seç
				],
				as: "scoreDetails",
			},
		},
		{
			$unwind: { path: "$scoreDetails", preserveNullAndEmptyArrays: true }, // scoreDetails boş olabilir
		},
		// 4. Gereksiz kullanıcı detaylarını filtrele
		{
			$match: {
				"userDetails._id": { $ne: null },
				"userDetails.username": { $ne: null },
				"userDetails.walletAddress": { $ne: null }, // Cüzdan adresi olmayanları hariç tut
			},
		},
		// 5. Gerekli alanları seç ve dönüştür
		{
			$project: {
				userId: "$userDetails._id", // User ID
				nickname: "$userDetails.username", // Şimdilik username'i kullan
				walletAddress: "$userDetails.walletAddress", // Cüzdan adresi
				score: { $ifNull: ["$scoreDetails.score", null] }, // Score'dan gelen skor, yoksa null
				finishTime: 1, // ParticipatedUser'dan finishTime
				startTime: "$createdAt", // Renamed createdAt to startTime
				_id: 0, // _id'yi dahil etme
			},
		},
		// 6. Skorlarına ve finishTime değerine göre sırala
		{
			$sort: {
				score: -1, // Skora göre azalan sırala
				finishTime: 1, // Skor eşitse, finishTime'a göre artan sırala
			},
		},
	];

	return await ParticipatedUser.aggregate(pipeline);
}

function getLeaderboard(participants: Participant[]): Leaderboard {
	return participants
		.filter((p): p is Participant & { score: number } => p.score !== null)
		.sort((a, b) => b.score - a.score)
		.slice(0, 10) as Leaderboard;
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
	updateExamStatus,
};
