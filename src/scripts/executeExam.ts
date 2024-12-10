import axios from "axios";
import * as fs from "fs";

// Mina Signer Client (Örnek için kullanılıyor)
var Client = require("mina-signer");
const signerClient = new Client({ network: "testnet" });

const baseURL = "http://localhost:3000";

type Wallet = {
	publicKey: string;
	privateKey: string;
};

const privkeys = [
	process.env.ADMIN_PRIVATE_KEY?.toString(),
	process.env.PRIV_KEY_1?.toString(),
	process.env.PRIV_KEY_2?.toString(),
	process.env.PRIV_KEY_3?.toString(),
	process.env.PRIV_KEY_4?.toString(),
	process.env.PRIV_KEY_5?.toString(),
];

// Wallet listesini yükleyin
// PRIVATE KEYS COME FROM .ENV FILE (i.e. ADMIN_PRIVATE_KEY, PRIV_KEY_1, PRIV_KEY_2 ...)
const publickeys = JSON.parse(fs.readFileSync("./src/scripts/wallets.json", "utf-8"));

const sampleData = JSON.parse(fs.readFileSync("./src/scripts/sampleData.json", "utf-8"));

// Cookie değişkeni
let sessionCookie = "";

const getMessage = async (address: string) => {
	try {
		const response = await axios.get(`${baseURL}/users/session/get-message-to-sign/${address}`, {
			withCredentials: true,
		});

		// Birden fazla cookie varsa birleştir
		sessionCookie = response.headers["set-cookie"]?.join("; ") || "";
		if (!sessionCookie) {
			console.warn("No Set-Cookie header received from backend.");
		}

		console.log("Set-Cookie Header:", response.headers["set-cookie"]);
		console.log("Session Cookie Saved:", sessionCookie);

		return response.data.message;
	} catch (error) {
		// console.error(`Error when getting message for address ${address}:`, error);
		throw error;
	}
};

const signMessage = async (privKey: string, message: any) => {
	try {
		const signResult = signerClient.signMessage(message, privKey);
		console.log("Signature:", signResult);
		return signResult;
	} catch (error) {
		// console.error(`Error when signing message:`, error);
		throw error;
	}
};

const register = async (walletAddress: string, signature: any) => {
	try {
		console.log("Sending Signature:", signature);
		const response = await axios.post(
			`${baseURL}/users/register`,
			{
				walletAddress: walletAddress,
				signature: signature,
			},
			{
				headers: {
					Cookie: sessionCookie, // Kaydedilen cookie'yi kullan
				},
				withCredentials: true,
			}
		);

		// console.log("Registration Response:", response.data);
		return response.data;
	} catch (error) {
		// console.error(`Error when registering address ${walletAddress}:`, error);
		throw error;
	}
};

const createExam = async (examData: any) => {
	try {
		// console.log("Exam Data işte böyle: ", examData);
		const response = await axios.post(`${baseURL}/exams/create`, examData, {
			headers: {
				Cookie: sessionCookie, // Kaydedilen cookie'yi kullan
			},
			withCredentials: true,
		});
		// console.log("Neler oluyo olum burda: ");
		return response.data;
	} catch (error) {
		console.error(`Error when creating exam`, error);
		throw error;
	}
};

const startExam = async (examId: string) => {
	try {
		// console.log("Exam Id işte böyle: ", examId);
		const response = await axios.post(
			`${baseURL}/exams/startExam`,
			{ examId: examId },
			{
				headers: {
					Cookie: sessionCookie, // Kaydedilen cookie'yi kullan
				},
				withCredentials: true,
			}
		);
		return response.data;
	} catch (error) {
		console.error(`Error when starting exam`, error);
		throw error;
	}
};

const getQuestions = async (examId: string) => {
	try {
		// console.log("Exam Id işte böyle: ", examId);
		const response = await axios.get(`${baseURL}/questions/${examId}`, {
			headers: {
				Cookie: sessionCookie, // Kaydedilen cookie'yi kullan
			},
			withCredentials: true,
		});
		return response.data;
	} catch (error) {
		console.error(`Error when getting questions`, error);
		throw error;
	}
};

const finishExam = async (finishExamData: any) => {
	try {
		// console.log("Exam Id işte böyle: ", finishExamData);
		const response = await axios.post(`${baseURL}/exams/finishExam`, finishExamData, {
			headers: {
				Cookie: sessionCookie, // Kaydedilen cookie'yi kullan
			},
			withCredentials: true,
		});
		return response.data;
	} catch (error) {
		console.error(`Error when finishing exam`, error);
		throw error;
	}
};

const putEmail = async (email: string) => {
	try {
		const response = await axios.post(
			`${baseURL}/users/put/email`,
			{ email: email },
			{
				headers: {
					Cookie: sessionCookie, // Kaydedilen cookie'yi kullan
				},
				withCredentials: true,
			}
		);
		return response.data;
	} catch (error) {
		console.error(`Error when putting email`, error);
		throw error;
	}
};

const runProcess = async () => {
	try {
		let wallets: Wallet[] = [];
		for (let i = 0; i < privkeys.length; i++) {
			const wallet = { publicKey: publickeys[i], privateKey: privkeys[i] || "" };
			wallets.push(wallet);
		}

		const wallet: Wallet = { publicKey: publickeys[0], privateKey: privkeys[0] || "" };
		let examData = sampleData.sampleExam;
		examData.startDate = new Date().toISOString();

		const message = await getMessage(wallet.publicKey);
		const signature = await signMessage(wallet.privateKey, message);
		await register(wallet.publicKey, signature.signature);

		const email = "swordlionthelionheart@gmail.com";
		await putEmail(email);

		const createExamRes = await createExam(examData);
		console.log("Exam created: ", createExamRes);

		const examId = createExamRes._id;

		// const startExamRes = await startExam(examId);
		// console.log("Sınava girdik: ", startExamRes);

		// const getQuestionsRes = await getQuestions(examId);
		// console.log("Sınav soruları da burada: ", getQuestionsRes);

		// let finishExamData = sampleData.sampleAnswer;
		// finishExamData.examId = examId;

		// finishExamData.answers.forEach((answer: any, index: any) => {
		// 	if (index < getQuestionsRes.length) {
		// 		answer.questionId = getQuestionsRes[index]._id;
		// 	}
		// });

		// console.log("ExamId: ", examId);
		// console.log("FinishExamData son hali: ", finishExamData);

		// const finishExamRes = await finishExam(finishExamData);
		// console.log("Sınavı bitirdim: ", finishExamRes);

		// const email = "swordlionthelionheart@gmail.com";

		// const putEmailRes = await putEmail(email);
		// console.log("Emailimi de koydum: ", putEmailRes);

		for (const wallet of wallets.slice(1, 3)) {
			console.log("Processing wallet:", wallet.publicKey);

			const message = await getMessage(wallet.publicKey);
			console.log("Received Message:", message);

			const signature = await signMessage(wallet.privateKey, message);
			console.log("Generated Signature:", signature);

			const registrationResult = await register(wallet.publicKey, signature.signature);

			// console.log("Final Session State:", registrationResult.session);

			const startExamRes = await startExam(examId);
			// console.log("Sınava girdik: ", startExamRes);

			const getQuestionsRes = await getQuestions(examId);

			let finishExamData = sampleData.sampleAnswer;
			finishExamData.examId = examId;

			finishExamData.answers.forEach((answer: any, index: any) => {
				if (index < getQuestionsRes.length) {
					answer.questionId = getQuestionsRes[index]._id;
				}
			});

			// console.log("ExamId: ", examId);
			// console.log("FinishExamData son hali: ", finishExamData);

			const finishExamRes = await finishExam(finishExamData);
			// console.log("Sınavı bitirdim: ", finishExamRes);

			const email = "swordlionthelionheart@gmail.com";

			const putEmailRes = await putEmail(email);
			console.log("Emailimi de koydum: ", putEmailRes);
		}
	} catch (error) {
		// console.error("An error occurred during the process:", error);
	}
};

// Scripti çalıştır
runProcess();
