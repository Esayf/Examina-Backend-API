import { z } from "zod";
import { Types } from "mongoose";

// Helper function to validate MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId format" });

// Base schemas for reusable components
const optionSchema = z.object({
	number: z.number().int().min(1),
	text: z.string().min(1, "Option text cannot be empty"),
});

const questionSchema = z
	.object({
		text: z.string().min(1, "Question text cannot be empty"),
		options: z.array(optionSchema).min(2, "At least 2 options are required").max(6, "Maximum 6 options allowed"),
		correctAnswer: z.number().int().min(1),
		number: z.number().int().min(1),
	})
	.refine((data) => data.correctAnswer <= data.options.length, {
		message: "Correct answer must be within the range of available options",
	});

// Common fields that appear in multiple schemas
const commonDraftFields = {
	title: z.string().min(3, "Title must be at least 3 characters"),
	description: z.string().optional(),
	startDate: z.string().datetime({ message: "Invalid date format" }).optional(),
	duration: z.number().int().positive("Duration must be positive").optional(),
	questionCount: z.number().int().positive().optional(),
	isRewarded: z.boolean().optional(),
	isPrivate: z.boolean().optional(),
	questions: z.array(questionSchema).optional(),
	rewardPerWinner: z.number().positive().optional(),
	passingScore: z.number().min(0).max(100).optional(),
};

export const draftSchemas = {
	// Schema for creating a new draft
	createDraft: z
		.object({
			...commonDraftFields,
		})
		.refine(
			(data) => {
				if (data.isRewarded) {
					return data.rewardPerWinner !== undefined && data.passingScore !== undefined;
				}
				return true;
			},
			{
				message: "Rewarded exams must include reward per winner and passing score",
				path: ["isRewarded"],
			}
		),

	// Schema for updating an existing draft
	updateDraft: z
		.object({
			...commonDraftFields,
		})
		.partial()
		.refine(
			(data) => {
				if (data.isRewarded) {
					return data.rewardPerWinner !== undefined && data.passingScore !== undefined;
				}
				return true;
			},
			{
				message: "Rewarded exams must include reward per winner and passing score",
				path: ["isRewarded"],
			}
		),

	// Schema for route parameters
	params: z.object({
		id: objectIdSchema,
	}),

	// Schema for query parameters (if needed)
	query: z
		.object({
			page: z.string().regex(/^\d+$/).transform(Number).optional(),
			limit: z.string().regex(/^\d+$/).transform(Number).optional(),
			sort: z.enum(["asc", "desc"]).optional(),
		})
		.optional(),
} as const;

// Type exports for use in services and controllers
export type CreateDraftInput = z.infer<typeof draftSchemas.createDraft>;
export type UpdateDraftInput = z.infer<typeof draftSchemas.updateDraft>;
export type DraftQueryParams = z.infer<typeof draftSchemas.query>;
