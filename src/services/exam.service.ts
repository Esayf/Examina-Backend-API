import { ExamDocument, QuestionInput, QuestionDocument, Answer, AnswerKey, ExtendedExamDocument } from "../types";
import Exam from "../models/exam.model";
import Question from "../models/question.model";
import ParticipatedUser from "@/models/participatedUser.model";
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

export type Winner = {
	walletAddress: string;
	score: number;
	finishTime: Date;
};

export type Participant = {
	userId: string;
	nickname: string; // TODO: Will be nicknames after random nickname implementation. For now username it is.
	walletAddress: string;
	score?: string;
	finishTime: Date;
};

type Leaderboard = {
	nickname: string;
	score: string | any;
	finishTime: Date;
}[];

async function getDetails(examId: string): Promise<ExtendedExamDocument | null> {
	try {
		let exam: ExtendedExamDocument | null = await Exam.findById(examId);
		if (exam && exam.isCompleted) {
			let examObject = exam.toObject();
			if (exam.isRewarded) {
				const winnerlist: Winner[] = await getWinnerlist(exam._id);
				console.log("WINNERLIST: ", winnerlist);
				examObject.winnerlist = winnerlist;
			}
			// TODO: Leaderboard Feature
			const participants: Participant[] = await getParticipants(exam._id);
			examObject.participants = participants;
			console.log("PARTICIPANTS: ", participants);
			const leaderboard = getLeaderboard(participants);
			console.log("LEADERBOARD: ", leaderboard);
			examObject.leaderboard = leaderboard;
			console.log("EXAM EXAM EXAM: ", examObject);
			return examObject as ExtendedExamDocument;
		}
		return exam as ExtendedExamDocument;
	} catch (error) {
		console.error("Error fetching exam details: ", error);
		throw new Error("Error fetching exam details");
	}
}

async function start(examId: string, userId: string, passcode: string, nickname: string | null): Promise<ExamResult> {
	try {
		let randomNickname = nickname || (await participatedUserService.generateRandomNickname(examId));
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

		const participationResult = await participatedUserService.checkParticipation(userId, examId, randomNickname, {
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

async function getWinnerlist(examId: string): Promise<
	{
		walletAddress: string;
		score: number;
		finishTime: Date;
	}[]
> {
	const pipeline: any[] = [
		// 1. Sınav ve kazananları filtrele
		{
			$match: {
				exam: examId,
				isFinished: true,
				isWinner: true,
			},
		},
		// 2. Kullanıcı bilgilerini eklemek için users koleksiyonunu ilişkilendir
		{
			$lookup: {
				from: "users", // User koleksiyonu
				localField: "user", // ParticipatedUser'daki user alanı
				foreignField: "_id", // User'daki _id alanı
				as: "userDetails", // Sonuç alanı
			},
		},
		{
			$unwind: "$userDetails", // userDetails dizisini düzleştir
		},
		// 3. Score koleksiyonundan ilgili skoru ekle
		{
			$lookup: {
				from: "scores",
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
				"userDetails.walletAddress": { $ne: null }, // Cüzdan adresi olmayanları hariç tut
			},
		},
		// 5. Sonuçları seç
		{
			$project: {
				walletAddress: "$userDetails.walletAddress",
				score: { $ifNull: ["$scoreDetails.score", 0] }, // Skor yoksa 0
				finishTime: 1, // FinishTime ParticipatedUser'dan gelir
				_id: 0,
			},
		},
		// 6. Skora göre azalan, finishTime'a göre artan sırala
		{
			$sort: {
				score: -1, // Skor büyükten küçüğe
				finishTime: 1, // Aynı skorlar için finishTime küçükten büyüğe
			},
		},
	];

	// 7. Pipeline'ı çalıştır ve sonuçları döndür
	const result = await ParticipatedUser.aggregate(pipeline);
	return result.map((doc: Winner) => ({
		walletAddress: doc.walletAddress,
		score: doc.score,
		finishTime: doc.finishTime,
	}));
}

async function getParticipants(examId: string): Promise<Participant[]> {
	const pipeline: any[] = [
		// 1. Sınavı ve bitmiş olanları filtrele
		{
			$match: {
				exam: examId,
				isFinished: true,
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
				score: { $ifNull: ["$scoreDetails.score", 0] }, // Score'dan gelen skor, yoksa 0
				finishTime: 1, // ParticipatedUser'dan finishTime
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
	const leaderboard: Leaderboard = participants.map((participant) => ({
		nickname: participant.nickname,
		score: participant.score,
		finishTime: participant.finishTime,
	}));
	return leaderboard.slice(0, 10);
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
