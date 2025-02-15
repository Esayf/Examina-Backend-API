import mongoose from "mongoose";
import examService from "@/services/exam.service";
import { ExamSessionService } from "@/services/examSession.service";
import Exam from "@/models/exam.model";
import ExamSession from "@/models/examSession.model";
import User from "@/models/user.model";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/utils/errors";
import { describe, expect, it, beforeEach } from "bun:test";
import checkCompletedExams from "@/cron/checkCompletedExams";
import { ExamDocument } from "@/typings";
import { ExamSessionDocument } from "@/models/examSession.model";

const examSessionService = new ExamSessionService();

// Helper function to generate unique wallet addresses
function generateUniqueWalletAddress() {
	return `0x${Date.now()}-${Math.random().toString(36).substr(2, 40)}`;
}

// Type for documents with ObjectId
type WithId<T> = T & { _id: mongoose.Types.ObjectId };

describe("Flexible Exam Functionality", () => {
	let userId: string;
	let user: WithId<mongoose.Document>;

	beforeEach(async () => {
		// Clean up the database before each test
		await Promise.all([User.deleteMany({}), Exam.deleteMany({}), ExamSession.deleteMany({})]);

		// Create a test user with a unique wallet address
		const timestamp = Date.now();
		user = (await User.create({
			email: `test${timestamp}@example.com`,
			username: `testuser${timestamp}`,
			walletAddress: generateUniqueWalletAddress(),
			isAdmin: false,
		})) as WithId<mongoose.Document>;
		userId = user._id.toString();
	});

	describe("Exam Creation", () => {
		it("should create a flexible exam with valid data", async () => {
			const examData = {
				creator: userId,
				title: "Flexible Test Exam",
				description: "Test Description",
				startDate: new Date(),
				duration: 60,
				rootHash: "hash123",
				secretKey: "secret123",
				questionCount: 10,
				isRewarded: false,
				isFlexible: true,
				participantTimeLimit: 30,
			};

			const exam = await examService.create(examData, []);
			expect(exam.isFlexible).toBe(true);
			expect(exam.status).toBe("passive");
			expect(exam.participantTimeLimit).toBe(30);
		});

		it("should reject flexible exam creation without participant time limit", async () => {
			const examData = {
				creator: userId,
				title: "Invalid Flexible Exam",
				description: "Test Description",
				startDate: new Date(),
				duration: 60,
				rootHash: "hash123",
				secretKey: "secret123",
				questionCount: 10,
				isRewarded: false,
				isFlexible: true,
			};

			await expect(examService.create(examData, [])).rejects.toThrow(BadRequestError);
		});

		it("should reject flexible exam with invalid participant time limit", async () => {
			const examData = {
				creator: userId,
				title: "Invalid Time Limit Exam",
				description: "Test Description",
				startDate: new Date(),
				duration: 60,
				rootHash: "hash123",
				secretKey: "secret123",
				questionCount: 10,
				isRewarded: false,
				isFlexible: true,
				participantTimeLimit: 200, // Over 180 minutes
			};

			await expect(examService.create(examData, [])).rejects.toThrow(
				"Exam validation failed: participantTimeLimit: Participant time limit must be between 1 and 180 minutes for flexible exams"
			);
		});
	});

	describe("Exam Status Management", () => {
		let examId: string;

		beforeEach(async () => {
			const exam = (await Exam.create({
				creator: userId,
				title: "Status Test Exam",
				description: "Test Description",
				startDate: new Date(),
				duration: 60,
				rootHash: "hash123",
				secretKey: "secret123",
				questionCount: 10,
				isRewarded: false,
				isFlexible: true,
				participantTimeLimit: 30,
				status: "passive",
			})) as WithId<ExamDocument>;
			examId = exam._id.toString();
		});

		it("should allow creator to activate exam", async () => {
			const updatedExam = await examService.updateExamStatus(examId, userId, "active");
			expect(updatedExam.status).toBe("active");
		});

		it("should allow creator to deactivate exam", async () => {
			await examService.updateExamStatus(examId, userId, "active");
			const updatedExam = await examService.updateExamStatus(examId, userId, "passive");
			expect(updatedExam.status).toBe("passive");
		});

		it("should reject status update from non-creator", async () => {
			const otherUser = (await User.create({
				email: `other${Date.now()}@example.com`,
				username: `otheruser${Date.now()}`,
				walletAddress: generateUniqueWalletAddress(),
				isAdmin: false,
			})) as WithId<mongoose.Document>;

			await expect(examService.updateExamStatus(examId, otherUser._id.toString(), "active")).rejects.toThrow(
				ForbiddenError
			);
		});

		it("should reject status update for non-flexible exam", async () => {
			const classicExam = (await Exam.create({
				creator: userId,
				title: "Classic Exam",
				description: "Test Description",
				startDate: new Date(),
				duration: 60,
				rootHash: "hash123",
				secretKey: "secret123",
				questionCount: 10,
				isRewarded: false,
				isFlexible: false,
			})) as WithId<ExamDocument>;

			await expect(examService.updateExamStatus(classicExam._id.toString(), userId, "active")).rejects.toThrow(
				BadRequestError
			);
		});
	});

	describe("Participant Session Management", () => {
		let examId: string;

		beforeEach(async () => {
			const exam = (await Exam.create({
				creator: userId,
				title: "Session Test Exam",
				description: "Test Description",
				startDate: new Date(),
				duration: 60,
				rootHash: "hash123",
				secretKey: "secret123",
				questionCount: 10,
				isRewarded: false,
				isFlexible: true,
				participantTimeLimit: 30,
				status: "active",
			})) as WithId<ExamDocument>;
			examId = exam._id.toString();
		});

		it("should create session when participant starts exam", async () => {
			const session = await examSessionService.startSession(examId, userId);
			expect(session.remainingTime).toBe(30);
			expect(session.isCompleted).toBe(false);
		});

		it("should not allow starting session for inactive exam", async () => {
			await Exam.findByIdAndUpdate(examId, { status: "passive" });
			await expect(examSessionService.startSession(examId, userId)).rejects.toThrow(BadRequestError);
		});

		it("should track remaining time correctly", async () => {
			const session = (await examSessionService.startSession(examId, userId)) as WithId<ExamSessionDocument>;
			const updatedSession = await examSessionService.updateRemainingTime(session._id.toString(), 15);
			expect(updatedSession.remainingTime).toBe(15);
		});

		it("should complete session when time expires", async () => {
			const session = (await examSessionService.startSession(examId, userId)) as WithId<ExamSessionDocument>;
			const completedSession = await examSessionService.updateRemainingTime(session._id.toString(), 0);
			expect(completedSession.isCompleted).toBe(true);
			expect(completedSession.endTime).toBeDefined();
		});

		it("should not allow multiple active sessions for same user and exam", async () => {
			await examSessionService.startSession(examId, userId);
			const secondSession = await examSessionService.startSession(examId, userId);
			expect(secondSession.remainingTime).toBe(30);
		});
	});

	describe("Exam Completion", () => {
		let examId: string;

		beforeEach(async () => {
			const exam = (await Exam.create({
				creator: userId,
				title: "Completion Test Exam",
				description: "Test Description",
				startDate: new Date(),
				duration: 60,
				rootHash: "hash123",
				secretKey: "secret123",
				questionCount: 10,
				isRewarded: false,
				isFlexible: true,
				participantTimeLimit: 30,
				status: "active",
			})) as WithId<ExamDocument>;
			examId = exam._id.toString();
		});

		it("should mark exam as completed when all sessions are finished", async () => {
			const session = (await examSessionService.startSession(examId, userId)) as WithId<ExamSessionDocument>;
			await examSessionService.completeSession(session._id.toString());

			await checkCompletedExams();

			const updatedExam = await Exam.findById(examId);
			expect(updatedExam?.status).toBe("completed");
			expect(updatedExam?.isCompleted).toBe(true);
		});

		it("should not mark exam as completed with active sessions", async () => {
			await examSessionService.startSession(examId, userId);

			await checkCompletedExams();

			const updatedExam = await Exam.findById(examId);
			expect(updatedExam?.status).toBe("active");
			expect(updatedExam?.isCompleted).toBe(false);
		});
	});
});
