import mongoose from "mongoose";
import { describe, expect, it, beforeEach } from "bun:test";
import Exam from "@/models/exam.model";
import "./setup";

describe("Exam Model Validation", () => {
	const validExamData = {
		creator: new mongoose.Types.ObjectId(),
		title: "Test Exam",
		description: "Test Description",
		startDate: new Date(),
		duration: 60,
		rootHash: "hash123",
		secretKey: "secret123",
		questionCount: 10,
		isRewarded: false,
	};

	describe("Flexible Exam Validation", () => {
		// Reset database before each test
		beforeEach(async () => {
			await Exam.deleteMany({});
		});

		it("should require status field when exam is flexible", async () => {
			const flexibleExamWithoutStatus = {
				...validExamData,
				isFlexible: true,
				participantTimeLimit: 30,
				status: undefined, // explicitly set status to undefined
			};

			const exam = new Exam(flexibleExamWithoutStatus);
			let error: mongoose.Error.ValidationError | null = null;
			try {
				await exam.validate();
			} catch (e) {
				error = e as mongoose.Error.ValidationError;
			}
			expect(error).toBeDefined();
			expect(error?.errors.status).toBeDefined();
			expect(error?.errors.status?.kind).toBe("required");
		});

		it("should not require status field when exam is not flexible", async () => {
			const nonFlexibleExam = {
				...validExamData,
				isFlexible: false,
				// status is missing
			};

			const exam = new Exam(nonFlexibleExam);
			await expect(exam.validate()).resolves.toBeUndefined();
		});

		it("should require participantTimeLimit when exam is flexible", async () => {
			const flexibleExamWithoutTimeLimit = {
				...validExamData,
				isFlexible: true,
				status: "passive",
				// participantTimeLimit is missing
			};

			const exam = new Exam(flexibleExamWithoutTimeLimit);
			let error: mongoose.Error.ValidationError | null = null;
			try {
				await exam.validate();
			} catch (e) {
				error = e as mongoose.Error.ValidationError;
			}
			expect(error).toBeDefined();
			expect(error?.errors.participantTimeLimit).toBeDefined();
		});

		it("should validate participantTimeLimit range for flexible exams", async () => {
			// Test with invalid time limit (too high)
			const examWithHighTimeLimit = {
				...validExamData,
				isFlexible: true,
				status: "passive",
				participantTimeLimit: 181, // Over 180 minutes
			};

			const examHigh = new Exam(examWithHighTimeLimit);
			let error: mongoose.Error.ValidationError | null = null;
			try {
				await examHigh.validate();
			} catch (e) {
				error = e as mongoose.Error.ValidationError;
			}
			expect(error).toBeDefined();
			expect(error?.errors.participantTimeLimit).toBeDefined();
			expect(error?.errors.participantTimeLimit.message).toBe(
				"Participant time limit must be between 1 and 180 minutes for flexible exams"
			);

			// Test with invalid time limit (too low)
			const examWithLowTimeLimit = {
				...validExamData,
				isFlexible: true,
				status: "passive",
				participantTimeLimit: 0,
			};

			const examLow = new Exam(examWithLowTimeLimit);
			error = null;
			try {
				await examLow.validate();
			} catch (e) {
				error = e as mongoose.Error.ValidationError;
			}
			expect(error).toBeDefined();
			expect(error?.errors.participantTimeLimit).toBeDefined();
		});

		it("should accept valid flexible exam data", async () => {
			const validFlexibleExam = {
				...validExamData,
				isFlexible: true,
				status: "passive",
				participantTimeLimit: 60,
			};

			const exam = new Exam(validFlexibleExam);
			await expect(exam.validate()).resolves.toBeUndefined();
		});

		it("should allow participantTimeLimit to be missing for non-flexible exams", async () => {
			const nonFlexibleExam = {
				...validExamData,
				isFlexible: false,
				// participantTimeLimit is missing
			};

			const exam = new Exam(nonFlexibleExam);
			await expect(exam.validate()).resolves.toBeUndefined();
		});
	});
});
