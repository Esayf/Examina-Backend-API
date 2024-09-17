const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
var Client = require("mina-signer");
const session = require("supertest-session");
const User = require("../models/User");
// mainnet or testnet
const signerClient = new Client({ network: "mainnet" });

describe("Register Endpoint Tests", () => {
	let testSession = null;
	beforeEach(() => {
		testSession = session(app); // Test oturumu oluşturduk
	});
	afterAll(async () => {
		await User.deleteMany({});
		// await mongoose.disconnect();
		await mongoose.connection.close();
		testSession = null;
	});
	test("GET /register/session/get-message-to-sign/:walletAddress should return a message to sign for a given wallet address", async () => {
		const res = await testSession
			.get(
				"/register/session/get-message-to-sign/B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3"
			)
			.query({
				walletAddress:
					"B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3",
			});

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("message");

		testSession.session = testSession.session || {};
		const messageLength = res.body.message.length;
		const remainingPart = res.body.message.slice(0, messageLength - 55);
		testSession.session.token = remainingPart;
		testSession.session.message = res.body.message;

		const resGetSession = await testSession.get("/register/session");
		// console.log("Get Session", resGetSession.body.user);
	});

	// test("POST /register/ should authenticate user and create a new user or find an existing one", async () => {
	// 	// demo wallet keys
	// 	const keys_demo = {
	// 		publicKey:
	// 			"B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3",
	// 		privateKey: "EKEjW2PYb6cW5WD26ivv1wqR6AKT3a64zHbCg6VwoinhSQKAUnKQ",
	// 	};

	// 	// get a session message to verify
	// 	const resGet = await testSession
	// 		.get(
	// 			"/register/session/get-message-to-sign/B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3"
	// 		)
	// 		.query({
	// 			walletAddress:
	// 				"B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3",
	// 		});

	// 	// extract the message
	// 	const message = resGet.body.message;
	// 	console.log("Message: ", message);

	// 	testSession.session = testSession.session || {};
	// 	const messageLength = resGet.body.message.length;
	// 	const remainingPart = resGet.body.message.slice(0, messageLength - 55);
	// 	testSession.session.token = remainingPart;
	// 	testSession.session.message = { message: resGet.body.message };

	// 	// wallet signs the message with private key
	// 	const signParams = {
	// 		message: message,
	// 	};
	// 	// const signRes = signTransaction(keys_demo.privateKey, signParams);
	// 	let signResult;
	// 	try {
	// 		// let signClient = getSignClient();
	// 		// let signBody = params.message;
	// 		signResult = signerClient.signMessage(
	// 			signParams,
	// 			keys_demo.privateKey
	// 		);
	// 	} catch (err) {
	// 		signResult = { message: String(err) };
	// 	}

	// 	console.log("Signature: ", signResult);

	// 	const verifyBody = {
	// 		data: { message: signParams.message },
	// 		publicKey: keys_demo.publicKey,
	// 		signature: signResult.signature,
	// 	};
	// 	console.log("Verify Body: ", verifyBody);

	// 	const verifyResult = signerClient.verifyMessage(verifyBody);
	// 	console.log("Test Verify Result :", verifyResult);

	// 	// send the message to endpoint to verify
	// 	const res = await testSession.post("/register").send({
	// 		walletAddress: signResult.publicKey,
	// 		signature: JSON.parse(JSON.stringify(signResult.signature)),
	// 	});
	// 	if (res.status === 401) {
	// 		console.log(res.body.error);
	// 	}
	// 	expect(res.status).toBe(200);
	// 	expect(res.body).toHaveProperty("success", true);
	// 	expect(res.body).toHaveProperty("user");
	// });

	test("POST /register/ should respond with 'Invalid signature or didn't have session token'", async () => {
		// demo wallet keys
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
		const realMessage = resGet.body.message;
		const fakeMessage = "message";
		console.log("Message: ", realMessage);
		console.log("Fake Message: ", fakeMessage);

		testSession.session = testSession.session || {};
		const messageLength = resGet.body.message.length;
		const remainingPart = resGet.body.message.slice(0, messageLength - 55);
		testSession.session.token = remainingPart;
		testSession.session.message = { message: resGet.body.message };

		// const signMessage_demo =
		// 	"r90autB62qp9PvZH8zQh9sVr53ApUBrtwt8odZ7hXVXguhq6udpUYQVbRnpVJ";

		// wallet signs the FAKE message with private key
		const signParams = {
			message: fakeMessage,
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
		console.log("Signature: ", signResult);

		const realSignParams = {
			message: realMessage,
		};

		let realSignResult;
		try {
			// let signClient = getSignClient();
			// let signBody = params.message;
			realSignResult = signerClient.signMessage(
				realSignParams,
				keys_demo.privateKey
			);
		} catch (err) {
			realSignResult = { message: String(err) };
		}
		console.log("Real Signature: ", realSignResult);

		const isEqual = realSignResult.signature === signResult.signature;

		console.log("Is equal: ", isEqual);

		fakeSignature = {
			field: "20187308472959499197282132002348634947237350735045384676982170768323707710782",
			scalar: "865103642786804350208844285909586573108974998309200978991283948435663799274",
		};

		const verifyBody = {
			data: realSignParams,
			publicKey: keys_demo.publicKey,
			signature: fakeSignature,
		};
		console.log("Verify Body: ", verifyBody);

		const verifyResult = signerClient.verifyMessage(verifyBody);
		console.log("Test Verify Result :", verifyResult);

		// send the message to endpoint to verify
		const res = await testSession.post("/register").send({
			walletAddress: signResult.publicKey,
			signature: JSON.parse(JSON.stringify(fakeSignature)),
		});

		expect(res.status).toBe(401);
		expect(res.body).toHaveProperty(
			"error",
			"Invalid signature or didn't have session token"
		);
	});

	// test("GET /register/session should respond with 200 status code and the session token", async () => {
	// 	// get a session message to verify
	// 	const resGet = await testSession
	// 		.get(
	// 			"/register/session/get-message-to-sign/B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3"
	// 		)
	// 		.query({
	// 			walletAddress:
	// 				"B62qmCGGG98iPmNEeFLByG3tPdnR6UvVvrXbkDPAC7DYJUvJVHFm1B3",
	// 		});

	// 	// extract the message
	// 	const message = resGet.body.message;
	// 	console.log("Message: ", message);

	// 	testSession.session = testSession.session || {};
	// 	const messageLength = resGet.body.message.length;
	// 	const remainingPart = resGet.body.message.slice(0, messageLength - 55);
	// 	testSession.session.token = remainingPart;
	// 	testSession.session.message = { message: resGet.body.message };

	// 	const res = await testSession.get("/register/session");
	// 	expect(res.statusCode).toEqual(200);
	// 	expect(res.body).toHaveProperty("user");
	// 	expect(res.body.user).toEqual(testSession.session.token);
	// });
});
