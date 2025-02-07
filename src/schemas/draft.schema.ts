import { z } from "zod";
import { Types } from "mongoose";

// Helper function to validate MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId format" });

// Base schemas for reusable components
const optionSchema = z.object({
	number: z.number().int().min(1),
	text: z.string().optional(),
});

const questionSchema = z.object({
	text: z.string().optional(),
	options: z.array(optionSchema).optional(),
	correctAnswer: z.number().int().optional(),
	number: z.number().int().min(1),
	questionType: z.enum(["mc", "tf"]).optional(),
});

// Common fields that appear in multiple schemas
const commonDraftFields = {
	title: z.string().min(3, "Title must be at least 3 characters"),
	description: z.string().optional(),
	startDate: z.string().datetime({ message: "Invalid date format" }).optional(),
	duration: z.number().int().positive("Duration must be positive").optional(),
	questionCount: z.number().int().positive().optional(),
	isRewarded: z.boolean().optional(),
	totalRewardPoolAmount: z.number().positive().optional(),
	rewardPerWinner: z.number().positive().optional(),
	passingScore: z.number().min(0).max(100).optional(),
	isPrivate: z.boolean().optional(),
	questions: z.array(questionSchema).optional(),
};

export const draftSchemas = {
	// Schema for creating a new draft
	createDraft: z.object({
		...commonDraftFields,
	}),
	// Schema for updating an existing draft
	updateDraft: z.object({
		...commonDraftFields,
	}),
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
// export type CreateDraftInput = z.infer<typeof draftSchemas.createDraft>;
// export type UpdateDraftInput = z.infer<typeof draftSchemas.updateDraft>;
// export type DraftQueryParams = z.infer<typeof draftSchemas.query>;
