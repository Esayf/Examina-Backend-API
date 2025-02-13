import { z } from "zod";

export const pincodeSchemas = {
	params: z.object({
		pincode: z
			.string()
			.length(6, "Pincode must be 6 characters long")
			.transform((val) => val.toUpperCase()),
	}),
};
