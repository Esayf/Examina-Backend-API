import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationException } from "../exceptions/ValidationException";

interface ValidatorOptions {
	body?: ZodSchema;
	query?: ZodSchema;
	params?: ZodSchema;
}

export const validateRequest = (schemas: ValidatorOptions) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (schemas.body) {
				req.body = await schemas.body.parseAsync(req.body);
			}

			if (schemas.query) {
				req.query = await schemas.query.parseAsync(req.query);
			}

			if (schemas.params) {
				req.params = await schemas.params.parseAsync(req.params);
			}

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const validationError = new ValidationException(
					"Validation failed",
					error.errors.map((detail) => ({
						field: detail.path.join("."),
						message: detail.message,
					}))
				);
				res.status(400).json(validationError.toJSON());
				return;
			}
			next(error);
		}
	};
};
