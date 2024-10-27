const Joi = require("joi");

// "examID" and "questionID" change with "examId" and "questionId"?
const finishExamSchema = Joi.object({
	examId: Joi.string().required(),
	answers: Joi.array()
		.items(
			Joi.object({
				questionId: Joi.string().required(),
				answer: Joi.any().required(),
			})
		)
		.required(),
});

module.exports = { finishExamSchema };
