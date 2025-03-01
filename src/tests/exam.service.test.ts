import mongoose from "mongoose";
import examService from "@/services/exam.service";
import Exam from "@/models/exam.model";
import ParticipatedUser from "@/models/participatedUser.model";
import Score from "@/models/score.model";
import User from "@/models/user.model";
import { ExamDocument, ExtendedExamDocument } from "@/typings";

describe("Exam Service - getDetails", () => {
	it("should return null for non-existent exam", async () => {
		const nonExistentId = new mongoose.Types.ObjectId();
		const result = await examService.getDetails(nonExistentId.toString());
		expect(result).toBeNull();
	});

	it("should return basic exam details for incomplete exam", async () => {
		// Create test exam
		const examData = {
			creator: new mongoose.Types.ObjectId(),
			title: "Test Exam",
			description: "Test Description",
			startDate: new Date(),
			duration: 60,
			rootHash: "hash123",
			secretKey: "secret123",
			questionCount: 10,
			isRewarded: false,
			isCompleted: false,
		};

		const exam = await Exam.create(examData);
		const result = await examService.getDetails(exam.id.toString());

		expect(result).toBeDefined();
		expect(result?.title).toBe(examData.title);
		expect(result?.winnerlist).toBeUndefined();
		expect(result?.participants).toBeUndefined();
		expect(result?.leaderboard).toBeUndefined();
	});

	it("should return extended exam details for completed exam", async () => {
		// Create test exam
		const examData = {
			creator: new mongoose.Types.ObjectId(),
			title: "Test Exam",
			description: "Test Description",
			startDate: new Date(),
			duration: 60,
			rootHash: "hash123",
			secretKey: "secret123",
			questionCount: 10,
			isRewarded: true,
			isCompleted: true,
			rewardPerWinner: 100,
			passingScore: 80,
		};

		const exam = await Exam.create(examData);

		// Create test users first
		const user1Id = new mongoose.Types.ObjectId();
		const user2Id = new mongoose.Types.ObjectId();

		await User.create({
			_id: user1Id,
			email: "user1@test.com",
			username: "user1",
			walletAddress: "0x1234567890",
			// add other required fields based on your User model
		});

		await User.create({
			_id: user2Id,
			email: "user2@test.com",
			username: "user2",
			walletAddress: "0x0987654321",
			// add other required fields based on your User model
		});

		const finishTime1 = new Date();
		const finishTime2 = new Date(finishTime1.getTime() + 1000);

		// Create test participants
		await ParticipatedUser.create({
			user: user1Id,
			exam: exam.id,
			nickname: "user1",
			isFinished: true,
			finishTime: finishTime1,
			isWinner: true,
		});

		await ParticipatedUser.create({
			user: user2Id,
			exam: exam.id,
			nickname: "user2",
			isFinished: true,
			finishTime: finishTime2,
			isWinner: false,
		});

		// Create test scores
		await Score.create({
			user: user1Id,
			exam: exam.id,
			score: 90,
			totalQuestions: 10,
			correctAnswers: 9,
		});

		await Score.create({
			user: user2Id,
			exam: exam.id,
			score: 70,
			totalQuestions: 10,
			correctAnswers: 7,
		});

		const result = await examService.getDetails(exam.id.toString());
		const extendedResult = result as ExtendedExamDocument;

		expect(extendedResult).toBeDefined();
		expect(extendedResult.title).toBe(examData.title);

		// Check winnerlist
		expect(extendedResult.winnerlist).toBeDefined();
		expect(extendedResult.winnerlist?.length).toBe(1);
		expect(extendedResult.winnerlist?.[0]).toMatchObject({
			walletAddress: "0x1234567890",
			score: 90,
		});
		// Check that finishTime exists and is a Date
		expect(extendedResult.winnerlist?.[0].finishTime).toBeInstanceOf(Date);

		// Check participants
		expect(extendedResult.participants).toBeDefined();
		expect(extendedResult.participants?.length).toBe(2);

		// Check leaderboard
		expect(extendedResult.leaderboard).toBeDefined();
		expect(extendedResult.leaderboard?.length).toBe(2);
		expect(extendedResult.leaderboard?.[0].score).toBe(90);
		expect(extendedResult.leaderboard?.[1].score).toBe(70);
	});

	it("should handle rewarded exam without winners", async () => {
		const examData = {
			creator: new mongoose.Types.ObjectId(),
			title: "Test Exam",
			description: "Test Description",
			startDate: new Date(),
			duration: 60,
			rootHash: "hash123",
			secretKey: "secret123",
			questionCount: 10,
			isRewarded: true,
			isCompleted: true,
			rewardPerWinner: 100,
			passingScore: 80,
		};

		const exam = await Exam.create(examData);
		const result = await examService.getDetails(exam.id.toString());

		expect(result).toBeDefined();
		expect(result?.winnerlist).toBeDefined();
		expect(result?.winnerlist?.length).toBe(0);
		expect(result?.participants).toBeDefined();
		expect(result?.participants?.length).toBe(0);
	});
});
