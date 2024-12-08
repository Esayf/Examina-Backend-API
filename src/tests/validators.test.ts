import { describe, test, expect } from "bun:test";
import { Request } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validators";
import { createMockResponse, expectStatus } from "./setup";

describe("Validator Middleware", () => {
	const createMockRequest = (body = {}, query = {}, params = {}): Partial<Request> => ({
		body,
		query,
		params,
	});

	const mockNext = () => {};

	test("should pass validation with valid data", async () => {
		const schema = z.object({
			title: z.string(),
			duration: z.number().optional(),
		});

		const mockReq = createMockRequest({
			title: "Test Draft",
			duration: 60,
		});
		const mockRes = createMockResponse();

		const middleware = validateRequest({ body: schema });
		await middleware(mockReq as Request, mockRes, mockNext);

		expect(mockRes.status().statusCode).toBeUndefined(); // No status set means validation passed
	});

	test("should fail validation with invalid data", async () => {
		const schema = z.object({
			title: z.string(),
			duration: z.number(),
		});

		const mockReq = createMockRequest({
			title: "Test Draft",
			duration: "60", // Should be number
		});
		const mockRes = createMockResponse();

		const middleware = validateRequest({ body: schema });
		await middleware(mockReq as Request, mockRes, mockNext);

		expectStatus(mockRes, 400);
		expect(mockRes.body.error).toBe("ValidationException");
	});

	test("should validate query parameters", async () => {
		const schema = z.object({
			page: z.string().regex(/^\d+$/).transform(Number),
		});

		const mockReq = createMockRequest({}, { page: "123" });
		const mockRes = createMockResponse();

		const middleware = validateRequest({ query: schema });
		await middleware(mockReq as Request, mockRes, mockNext);

		expect(Number(mockReq.query?.page)).toBe(123);
	});

	test("should validate multiple parts of request", async () => {
		const schemas = {
			body: z.object({
				title: z.string(),
			}),
			params: z.object({
				id: z.string(),
			}),
			query: z.object({
				sort: z.enum(["asc", "desc"]),
			}),
		};

		const mockReq = createMockRequest({ title: "Test Draft" }, { sort: "asc" }, { id: "123" });
		const mockRes = createMockResponse();

		const middleware = validateRequest(schemas);
		await middleware(mockReq as Request, mockRes, mockNext);

		expect(mockRes.status().statusCode).toBeUndefined();
	});

	test("should handle unexpected errors", async () => {
		const schema = z.object({
			title: z.string(),
		});

		const mockReq = createMockRequest(undefined);
		const mockRes = createMockResponse();

		const middleware = validateRequest({ body: schema });
		await middleware(mockReq as Request, mockRes, mockNext);

		expectStatus(mockRes, 400);
	});
});
