import { describe, test, expect, beforeEach } from "bun:test";
import mongoose from "mongoose";
import Question from "@/models/question.model";
import Exam from "@/models/exam.model";
import User from "@/models/user.model";
import { CustomRequest } from "@/typings";
import questionController from "@/controllers/question.controller";
import { mockSession, createMockResponse, createMockRequest } from "./setup";
import ParticipatedUser from "@/models/participatedUser.model";

describe("Question Controller Tests", () => {
	let mockUser: any;
	let mockExam: any;
	let mockQuestions: any[];

	beforeEach(async () => {
		// Wait for mongoose connection to be ready
		if (mongoose.connection.readyState !== 1) {
			await new Promise<void>((resolve) => {
				mongoose.connection.once("connected", () => resolve());
			});
		}

		// Clear collections only if connection is ready
		await Promise.all([
			User.deleteMany({}),
			Exam.deleteMany({}),
			Question.deleteMany({}),
			ParticipatedUser.deleteMany({}),
		]);

		// Create test user
		mockUser = await User.create({
			username: `testuser_${Date.now()}`,
			walletAddress: `0x${Date.now()}`,
			email: `test${Date.now()}@test.com`,
		});

		// Create test exam
		mockExam = await Exam.create({
			title: "Test Exam",
			creator: mockUser._id,
			description: "Test Description",
			startDate: new Date(),
			duration: 60,
			status: "active",
			rootHash: "test_hash",
			secretKey: "test_key",
			questionCount: 3,
			isRewarded: false,
		});

		// Create test questions with known order
		mockQuestions = await Question.create([
			{
				exam: mockExam._id,
				text: "Question 1",
				options: [{ number: 1, text: "Option 1" }],
				correctAnswer: 1,
				number: 1,
			},
			{
				exam: mockExam._id,
				text: "Question 2",
				options: [{ number: 1, text: "Option 1" }],
				correctAnswer: 1,
				number: 2,
			},
			{
				exam: mockExam._id,
				text: "Question 3",
				options: [{ number: 1, text: "Option 1" }],
				correctAnswer: 1,
				number: 3,
			},
		]);
	});

	test("should return shuffled questions with sequential numbers", async () => {
		// Create participated user record
		await ParticipatedUser.create({
			user: mockUser.id,
			nickname: `testuser_${Date.now()}`,
			exam: mockExam.id,
			isFinished: false,
		});

		const mockRequest = createMockRequest(
			{}, // body
			{ examId: mockExam._id.toString() }, // params
			mockUser // user
		) as CustomRequest;

		const mockResponse = createMockResponse();
		await questionController.getQuestionsByExam(mockRequest, mockResponse);

		const questions = mockResponse.body;

		// Verify response structure
		expect(questions).toHaveLength(3);

		// Verify sequential numbers
		const numbers = questions.map((q: any) => q.number);
		expect(numbers).toEqual([1, 2, 3]);

		// Verify shuffle
		let foundDifferentOrder = false;
		for (let i = 0; i < 5; i++) {
			await questionController.getQuestionsByExam(mockRequest, mockResponse);
			const newTexts = mockResponse.body.map((q: any) => q.text);
			const originalTexts = mockQuestions.map((q) => q.text);

			if (JSON.stringify(originalTexts) !== JSON.stringify(newTexts)) {
				foundDifferentOrder = true;
				break;
			}
		}

		expect(foundDifferentOrder).toBe(true);
	});
});
