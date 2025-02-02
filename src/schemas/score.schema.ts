import { z } from "zod";
import { Types } from "mongoose";

// Helper function to validate MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId format" });

export const scoreSchemas = {
	params: z.object({
		examId: objectIdSchema,
	}),
};
