import Joi from "joi";
export const finishExamSchema = Joi.object({
    examId: Joi.string().required(),
    answers: Joi.array()
        .items(Joi.object({
        questionId: Joi.string().required(),
        answer: Joi.any().required(),
    }))
        .required(),
});
