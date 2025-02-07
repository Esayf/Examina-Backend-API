import { z } from "zod";

export const userSchemas = {
	params: z.object({
		walletAddress: z.string(),
	}),
	register: z.object({
		walletAddress: z.string(),
		signature: z.object({
			scalar: z.string(),
			field: z.string(),
		}),
	}),
	putEmail: z.object({
		email: z.string().email({ message: "Invalid email input" }),
	}),
};
