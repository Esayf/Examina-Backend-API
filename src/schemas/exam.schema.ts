import { z } from "zod";
import { Types } from "mongoose";

// Helper function to validate MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId format" });

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

const examCommonFields = {
	title: z.string().min(3, "Title must be at least 3 characters"),
	description: z.string().min(10, "Description must be at least 10 characters"),
	questions: z.array(questionSchema).min(1, "At least 1 question is required"),
	startDate: z.string().datetime({ message: "Invalid date format" }),
	duration: z.number().positive("Duration must be positive"),
	questionCount: z.number().int().positive("Question count must be positive"),
	rootHash: z.string().min(1, "Root hash is required"),
	secretKey: z.string().min(1, "Secret key is required"),
};

export const examSchemas = {
	createExam: z
		.object({
			...examCommonFields,
			isPrivate: z.boolean().optional(),
			isWinnerlistRequested: z.boolean().optional(),
			isRewarded: z.boolean(),
			passingScore: z.number().min(0).max(100, "Passing score must be between 0 and 100").optional(),
			deployJobId: z.string().optional(),
			contractAddress: z.string().optional(),
			rewardPerWinner: z.number().positive("Reward per winner must be positive").optional(),
		})
		.refine(
			(data) => {
				if (data.isRewarded) {
					return (
						data.rewardPerWinner !== undefined &&
						data.passingScore !== undefined &&
						data.deployJobId !== undefined &&
						data.contractAddress !== undefined
					);
				}
				return true; // Eğer isRewarded false ise kontrol gerekmez
			},
			{
				message:
					"Rewarded exams must include reward per winner, passing score, deployedJobId and contractAddress fields",
				path: ["isRewarded"], // Hatanın nerede oluştuğunu belirtir
			}
		),
	generateLinks: z.object({
		examId: objectIdSchema,
		emailList: z
			.array(z.string().email({ message: "Invalid email format" }))
			.min(1, { message: "Email list must contain at least one email" }),
	}),
	// myExamsQueryParams: z.object({
	// 	role: z
	// 		.string()
	// 		.transform((val) => val?.trim() || "") // Eğer `undefined` gelirse boş string yapar
	// 		.refine((val) => ["created", "joined"].includes(val), { message: "Role must be 'created' or 'joined'" }),

	// 	filter: z
	// 		.string()
	// 		.nullish() // `undefined` ve `null` değerleri güvenle ele alınır
	// 		.transform((val) => (val ? val.trim() : "all")) // Eğer boşsa "all" yap
	// 		.refine((val) => ["all", "upcoming", "active", "ended"].includes(val), {
	// 			message: "Invalid filter option",
	// 		}),

	// 	sortBy: z
	// 		.string()
	// 		.nullish() // `undefined` ve `null` değerleri güvenle ele alınır
	// 		.transform((val) => (val ? val.trim() : undefined))
	// 		.refine(
	// 			(val) =>
	// 				val === undefined ||
	// 				["title", "startDate", "duration", "createdAt", "score", "endDate", "status"].includes(val),
	// 			{
	// 				message: "Invalid sort field",
	// 			}
	// 		),

	// 	sortOrder: z
	// 		.string()
	// 		.nullish() // `undefined` ve `null` değerleri güvenle ele alınır
	// 		.transform((val) => (val ? val.trim() : "desc")) // Default olarak "desc" yap
	// 		.refine((val) => ["asc", "desc"].includes(val), { message: "Sort order must be 'asc' or 'desc'" }),
	// }),
	startExam: z.object({
		examId: objectIdSchema,
		passcode: z.string().min(1, "Passcode is required"),
		nickname: z.string().nullable(),
	}),
	finishExam: z.object({
		examId: objectIdSchema,
		answers: z.array(
			z.object({
				questionId: objectIdSchema,
				answer: z.string(),
			})
		),
	}),
	params: z.object({
		id: objectIdSchema,
	}),
};
