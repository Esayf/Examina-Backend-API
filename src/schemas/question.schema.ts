import { z } from "zod";
import { Types } from "mongoose";

// Helper function to validate MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId format" });

export const questionSchemas = {
	// `/question/:questionId` endpointi için şema
	questionIdParams: z.object({
		questionId: objectIdSchema,
	}),
	// `/:examId` endpointi için şema
	examIdParams: z.object({
		examId: objectIdSchema,
	}),
};
