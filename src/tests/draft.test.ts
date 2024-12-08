import { describe, test, expect, beforeEach } from "bun:test";
import mongoose from "mongoose";
import Draft from "../models/draft.model";
import User from "../models/user.model";
import { CustomRequest, DraftDocument } from "../types";
import draftController from "../controllers/draft.controller";
import { mockSession, createMockResponse, expectStatus, expectJson } from "./setup";
import { validateRequest } from "../middleware/validators";
import { draftSchemas } from "../schemas/draft.schema";
import { Request } from "express";

describe("Draft Controller Tests", () => {
	let mockUser: any;
	let otherUser: any;

	beforeEach(async () => {
		await User.deleteMany({});
		await Draft.deleteMany({});

		// Create test users
		mockUser = await User.create({
			username: `testuser_${Date.now()}`,
			walletAddress: `0x${Date.now()}`,
			email: `test${Date.now()}@test.com`,
		});

		otherUser = await User.create({
			username: `otheruser_${Date.now()}`,
			walletAddress: `0x${Date.now()}_other`,
			email: `other${Date.now()}@test.com`,
		});
	});

	const createMockRequest = (body: any = {}, params: any = {}, user: any = mockUser): CustomRequest =>
		({
			session: {
				...mockSession,
				user: {
					userId: user._id.toString(),
					walletAddress: user.walletAddress,
					isAdmin: false,
				},
			},
			body,
			params,
		}) as CustomRequest;

	describe("Create Draft", () => {
		test("should create a new draft with minimal data", async () => {
			const mockRequest = createMockRequest({
				title: "Minimal Draft",
			});

			const mockResponse = createMockResponse();
			await draftController.createDraft(mockRequest, mockResponse);

			expectStatus(mockResponse, 201);
			expect(mockResponse.body.title).toBe("Minimal Draft");
			expect(mockResponse.body.creator.toString()).toBe(mockUser._id.toString());

			// Verify in database
			const savedDraft = await Draft.findById(mockResponse.body._id);
			expect(savedDraft).toBeTruthy();
			expect(savedDraft?.title).toBe("Minimal Draft");
		});

		test("should create a draft with full data", async () => {
			const fullDraftData = {
				title: "Full Draft",
				description: "Complete draft with all fields",
				startDate: new Date(),
				duration: 60,
				questionCount: 10,
				isRewarded: true,
				rewardPerWinner: 100,
				passingScore: 70,
				questions: [
					{
						text: "Question 1",
						options: [
							{ number: 1, text: "Option 1" },
							{ number: 2, text: "Option 2" },
						],
						correctAnswer: 1,
						number: 1,
					},
				],
			};

			const mockRequest = createMockRequest(fullDraftData);
			const mockResponse = createMockResponse();

			await draftController.createDraft(mockRequest, mockResponse);

			expectStatus(mockResponse, 201);
			expect(mockResponse.body.title).toBe(fullDraftData.title);
			expect(mockResponse.body.description).toBe(fullDraftData.description);
			expect(mockResponse.body.duration).toBe(fullDraftData.duration);
			expect(mockResponse.body.questionCount).toBe(fullDraftData.questionCount);
			expect(mockResponse.body.isRewarded).toBe(fullDraftData.isRewarded);
			expect(mockResponse.body.rewardPerWinner).toBe(fullDraftData.rewardPerWinner);
			expect(mockResponse.body.passingScore).toBe(fullDraftData.passingScore);
		});

		test("should create multiple drafts", async () => {
			const draftData1 = {
				title: "Draft 1",
				description: "Draft 1 description",
				duration: 60,
				questionCount: 10,
				isRewarded: true,
				rewardPerWinner: 100,
				passingScore: 70,
			};

			const draftData2 = {
				title: "Draft 2",
				description: "Draft 2 description",
				duration: 60,
				questionCount: 10,
				questions: [
					{
						text: "Question 1",
						options: [
							{ number: 1, text: "Option 1" },
							{ number: 2, text: "Option 2" },
						],
					},
				],
			};

			// Actually create and test the drafts
			const mockResponse1 = createMockResponse();
			const mockResponse2 = createMockResponse();

			await draftController.createDraft(createMockRequest(draftData1), mockResponse1);
			await draftController.createDraft(createMockRequest(draftData2), mockResponse2);

			expectStatus(mockResponse1, 201);
			expectStatus(mockResponse2, 201);
		});

		test("should fail validation before reaching controller", async () => {
			const invalidRequest = createMockRequest({}); // Empty body
			const mockResponse = createMockResponse();
			const nextFunction = () => {};

			// Test the validation middleware directly
			const validator = validateRequest({
				body: draftSchemas.createDraft,
			});

			await validator(invalidRequest as Request<any, any, any, any>, mockResponse, nextFunction);

			expectStatus(mockResponse, 400);
			expect(mockResponse.body.error).toBe("ValidationException");
		});

		test("should fail without title", async () => {
			const mockRequest = createMockRequest({});
			const mockResponse = createMockResponse();

			// First run the validator
			const validator = validateRequest({
				body: draftSchemas.createDraft,
			});

			await validator(mockRequest as Request<any, any, any, any>, mockResponse, () => {
				// Only call controller if validation passes
				return draftController.createDraft(mockRequest as Request<any, any, any, any>, mockResponse);
			});

			expectStatus(mockResponse, 400);
		});
	});

	describe("Get Drafts", () => {
		test("should return empty array when no drafts exist", async () => {
			const mockRequest = createMockRequest();
			const mockResponse = createMockResponse();

			await draftController.getAllDrafts(mockRequest, mockResponse);

			expectStatus(mockResponse, 200);
			expect(mockResponse.body).toEqual([]);
		});

		test("should return only user's drafts", async () => {
			// Create drafts for both users
			await Draft.create({
				creator: mockUser._id,
				title: "User's Draft",
			});

			await Draft.create({
				creator: otherUser._id,
				title: "Other's Draft",
			});

			const mockRequest = createMockRequest();
			const mockResponse = createMockResponse();

			await draftController.getAllDrafts(mockRequest, mockResponse);

			expectStatus(mockResponse, 200);
			expect(mockResponse.body).toHaveLength(1);
			expect(mockResponse.body[0].title).toBe("User's Draft");
		});
	});

	describe("Update Draft", () => {
		test("should update own draft", async () => {
			const draft = (await Draft.create({
				creator: mockUser._id,
				title: "Original Title",
			})) as DraftDocument;

			const mockRequest = createMockRequest({ title: "Updated Title" }, { id: draft.id.toString() });
			const mockResponse = createMockResponse();

			await draftController.updateDraft(mockRequest, mockResponse);

			expectStatus(mockResponse, 200);
			expect(mockResponse.body.title).toBe("Updated Title");

			// Verify in database
			const updatedDraft = await Draft.findById(draft._id);
			expect(updatedDraft?.title).toBe("Updated Title");
		});

		test("should not update other user's draft", async () => {
			const draft = await Draft.create({
				creator: otherUser._id,
				title: "Other's Draft",
			});

			const mockRequest = createMockRequest({ title: "Attempted Update" }, { id: draft.id.toString() });
			const mockResponse = createMockResponse();

			await draftController.updateDraft(mockRequest, mockResponse);

			expectStatus(mockResponse, 403);

			// Verify not changed in database
			const unchangedDraft = await Draft.findById(draft._id);
			expect(unchangedDraft?.title).toBe("Other's Draft");
		});
	});

	describe("Delete Draft", () => {
		test("should delete own draft", async () => {
			const draft = await Draft.create({
				creator: mockUser._id,
				title: "To Delete",
			});

			const mockRequest = createMockRequest({}, { id: draft.id.toString() });
			const mockResponse = createMockResponse();

			await draftController.deleteDraft(mockRequest, mockResponse);

			expectStatus(mockResponse, 200);

			// Verify deletion
			const deletedDraft = await Draft.findById(draft._id);
			expect(deletedDraft).toBeNull();
		});

		test("should not delete other user's draft", async () => {
			const draft = await Draft.create({
				creator: otherUser._id,
				title: "Other's Draft",
			});

			const mockRequest = createMockRequest({}, { id: draft.id.toString() });
			const mockResponse = createMockResponse();

			await draftController.deleteDraft(mockRequest, mockResponse);

			expectStatus(mockResponse, 403);

			// Verify still exists
			const existingDraft = await Draft.findById(draft._id);
			expect(existingDraft).toBeTruthy();
		});
	});
});
