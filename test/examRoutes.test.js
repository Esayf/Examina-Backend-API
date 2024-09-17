const request = require("supertest");
const app = require("../app");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const session = require("supertest-session");
const mongoose = require("mongoose");
var Client = require("mina-signer");
const { questions } = require("./testQuestions");

const signerClient = new Client({ network: "mainnet" });

describe("Exam Endpoint Tests", () => {
	let testSession;
	beforeAll(async () => {
		testSession = session(app);
		const keys_demo = {
			publicKey:
				"B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3",
			privateKey: "EKEjW2PYb6cW5WD26ivv1wqR6AKT3a64zHbCg6VwoinhSQKAUnKQ",
		};

		// get a session message to verify
		const resGet = await testSession
			.get(
				"/register/session/get-message-to-sign/B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3"
			)
			.query({
				walletAddress:
					"B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3",
			});

		// extract the message
		const message = resGet.body.message;

		testSession.session = testSession.session || {};
		testSession.session.token = resGet.body.message;
		testSession.session.message = resGet.body;
		const signParams = {
			message: message,
		};
		let signResult;
		try {
			signResult = signerClient.signMessage(
				signParams,
				keys_demo.privateKey
			);
		} catch (err) {
			signResult = { message: String(err) };
		}

		// send the message to endpoint to verify
		const res = await testSession.post("/register").send({
			walletAddress: signResult.publicKey,
			signature: JSON.parse(JSON.stringify(signResult.signature)),
		});
	});
	afterAll(async () => {
		await Exam.deleteMany({});
		await Question.deleteMany({});
		await Answer.deleteMany({});
		// await mongoose.disconnect();
		await mongoose.connection.close();
		testSession.destroy();
	});

	let testExamId;
	let fakeTestExamId;
	let testQuestionId;
	let fakeTestQuestionId;
	let testAnswerId;
	let fakeTestAnswerId;

	// Exam oluşturma testi
	test("POST /exams/create should create a new exam and respond with 200 status code and success message", async () => {
		const res = await testSession.post("/exams/create").send({
			title: "Test Exam",
			description: "This is a test exam",
			startDate: new Date(),
			duration: 1440,
			rootHash: "testroot123",
			secretKey: "testsecret123",
			questions: questions,
		});
		expect(res.statusCode).toEqual(200);
		expect(res.body.message).toEqual("Exam created successfully");
		testExamId = res.body.newExam._id;
	});

	// We want to an internal server error by a type error about questions array
	test("POST /exams/create should respond with status code 500 due to saving error", async () => {
		const res = await testSession.post("/exams/create").send({
			title: "Test Exam",
			description: "This is a test exam",
			startDate: new Date(),
			duration: 1440,
			rootHash: "testroot123",
			secretKey: "testsecret123",
			questions: "questions",
		});
		expect(res.statusCode).toEqual(500);
		// expect(res.body.message).toHaveProperty("type", "Error when saving");
	});

	// Exam bilgilerini alma testi
	test("GET /exams should respond with 200 status code and the all exams details", async () => {
		const res = await testSession.get(`/exams`);
		expect(res.statusCode).toEqual(200);
		console.log("Exams: ", res.body);
	});

	// Exam bilgilerini alma testi
	test("GET /exams/:id should respond with 200 status code and the exam details", async () => {
		const res = await testSession.get(`/exams/${testExamId}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body._id).toEqual(testExamId);
	});

	// Exam bilgilerini alma testi
	test("GET /exams/:id should respond with 404 status code due to wrong exam id", async () => {
		fakeTestExamId = "6605768c642d1dea4766e07b";
		console.log("Test Exam Id: ", testExamId);
		const res = await testSession.get(`/exams/${fakeTestExamId}`);
		expect(res.statusCode).toEqual(404);
	});

	// GET /:id/questions endpoint testi
	test("GET /exams/:id/questions should respond with 200 status code and the questions", async () => {
		const res = await testSession.get(`/exams/${testExamId}/questions`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toBeDefined();
		console.log("Questions: ", res.body);
	});

	test("GET /exams/:id/questions should respond with 404 status code due to wrong exam id", async () => {
		fakeTestExamId = "7605768c642d1dea4766e07b";
		const res = await testSession.get(`/exams/${fakeTestExamId}/questions`);
		expect(res.statusCode).toEqual(404);
	});

	// GET /:id/question/:questionid endpoint testi
	test("GET /exams/:id/question/:questionid should respond with 200 status code and the details of a specific question", async () => {
		const questionsRes = await testSession.get(
			`/exams/${testExamId}/questions`
		);

		// Test çıktısını kontrol etmek için log ekleyin
		console.log(questionsRes.body);

		testQuestionId = questionsRes.body[0]._id;

		const res = await testSession.get(
			`/exams/${testExamId}/question/${testQuestionId}`
		);

		// Test çıktısını kontrol etmek için log ekleyin
		console.log(res.body);

		expect(res.statusCode).toEqual(200);
		expect(res.body._id).toEqual(testQuestionId);
	});

	test("GET /exams/:id/question/:questionid should respond with 404 status code due to wrong exam id", async () => {
		const questionsRes = await testSession.get(
			`/exams/${testExamId}/questions`
		);

		testQuestionId = questionsRes.body[0]._id;
		fakeTestExamId = "6605768c642d1dea4766e07b";

		const res = await testSession.get(
			`/exams/${fakeTestExamId}/question/${testQuestionId}`
		);
		expect(res.statusCode).toEqual(404);
	});

	test("GET /exams/:id/question/:questionid should respond with 404 status code due to wrong question id", async () => {
		const questionsRes = await testSession.get(
			`/exams/${testExamId}/questions`
		);

		testQuestionId = questionsRes.body[0]._id;
		fakeTestQuestionId = "6605768c642d1dea4766e07b";

		const res = await testSession.get(
			`/exams/${testExamId}/question/${fakeTestQuestionId}`
		);
		expect(res.statusCode).toEqual(404);
	});

	// Answer gönderme testi
	test("POST /exams/:id/answer/submit should submit an answer and respond with 200 status code", async () => {
		const questionsRes = await testSession.get(
			`/exams/${testExamId}/questions`
		);

		testQuestionId = questionsRes.body[0]._id;

		const res = await testSession
			.post(`/exams/${testExamId}/answer/submit`)
			.send({
				answer: {
					questionId: testQuestionId,
					selectedOption: 0,
				},
			});

		expect(res.statusCode).toEqual(200);
		expect(res.body.message).toEqual("Answer submitted successfully");
	});

	test("POST /exams/:id/answer/submit should respond with 404 status code due to wrong exam id", async () => {
		const questionsRes = await testSession.get(
			`/exams/${testExamId}/questions`
		);

		testQuestionId = questionsRes.body[0]._id;
		fakeTestExamId = "6605768c642d1dea4766e07b";

		const res = await testSession
			.post(`/exams/${fakeTestExamId}/answer/submit`)
			.send({
				answer: {
					questionId: testQuestionId,
					selectedOption: 0,
				},
			});

		expect(res.statusCode).toEqual(404);
		expect(res.body.message).toEqual("Exam not found");
	});

	test("POST /exams/:id/answer/submit should submit an answer and update the answer with status 200", async () => {
		const answersRes = await testSession.get(
			`/exams/${testExamId}/answers`
		);
		testAnswerId = answersRes.body[0]._id;

		console.log(
			"Initial Answer: ",
			answersRes.body[0].answers[0].selectedOption
		);

		const questionsRes = await testSession.get(
			`/exams/${testExamId}/questions`
		);

		testQuestionId = questionsRes.body[0]._id;

		const res = await testSession
			.post(`/exams/${testExamId}/answer/submit`)
			.send({
				answer: {
					questionId: testQuestionId,
					selectedOption: 1,
				},
			});

		expect(res.statusCode).toEqual(200);
		expect(res.body.message).toEqual("Answer submitted successfully");
	});

	// GET /:id/answers endpoint testi
	test("GET /exams/:id/answers should respond with 200 status code and the answers for the exam", async () => {
		const res = await testSession.get(`/exams/${testExamId}/answers`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toBeDefined();
		console.log("Answers: ", res.body);
	});

	test("GET /exams/:id/answers should respond with 404 status code due to wrong exam id", async () => {
		fakeTestExamId = "6605768c642d1dea4766e07b";
		const res = await testSession.get(`/exams/${fakeTestExamId}/answers`);
		expect(res.statusCode).toEqual(404);
	});

	// GET /:id/answers/:answerid endpoint testi
	test("GET /exams/:id/answers/:answerid should respond with 200 status code and the details of a specific answer", async () => {
		const answersRes = await testSession.get(
			`/exams/${testExamId}/answers`
		);
		testAnswerId = answersRes.body[0]._id;

		const res = await testSession.get(
			`/exams/${testExamId}/answers/${testAnswerId}`
		);
		expect(res.statusCode).toEqual(200);
		expect(res.body._id).toEqual(testAnswerId);
		console.log(
			"Final Answer: ",
			answersRes.body[0].answers[0].selectedOption
		);
	});

	test("GET /exams/:id/answers/:answerid should respond with 404 status code due to wrong exam id", async () => {
		const answersRes = await testSession.get(
			`/exams/${testExamId}/answers`
		);
		testAnswerId = answersRes.body[0]._id;

		fakeTestExamId = "6605768c642d1dea4766e07b";
		const res = await testSession.get(
			`/exams/${fakeTestExamId}/answers/${testAnswerId}`
		);
		expect(res.statusCode).toEqual(404);
	});

	// // GET /question/:id endpoint testi
	// test("GET /exams/question/:id should respond with 200 status code and the details of a specific question", async () => {
	// 	const questionsRes = await testSession.get(
	// 		`/exams/${testExamId}/questions`
	// 	);

	// 	testQuestionId = questionsRes.body[0]._id;

	// 	const res = await testSession.get(`/exams/question/${testQuestionId}`);
	// 	expect(res.statusCode).toEqual(200);
	// 	expect(res.body._id).toEqual(testQuestionId);
	// });

	// test("GET /exams/question/:id should respond with 404 status code due to wrong question id", async () => {
	// 	const questionsRes = await testSession.get(
	// 		`/exams/${testExamId}/questions`
	// 	);

	// 	testQuestionId = questionsRes.body[0]._id;

	// 	fakeTestQuestionId = "6605768c642d1dea4766e07b";
	// 	const res = await testSession.get(
	// 		`/exams/question/${fakeTestQuestionId}`
	// 	);
	// 	expect(res.statusCode).toEqual(404);
	// });
});
