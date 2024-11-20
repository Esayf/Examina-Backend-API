"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnswerArray = generateAnswerArray;
exports.verifySignature = verifySignature;
exports.processQuestion = processQuestion;
exports.isExamCompleted = isExamCompleted;
exports.checkExamTimes = checkExamTimes;
exports.calculateScore = calculateScore;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const MinaSigner = require("mina-signer");
const signerClient = new MinaSigner({ network: "mainnet" });
function generateAnswerArray(answers, walletAddress) {
    return answers.map((answer) => {
        const hashInput = walletAddress + JSON.stringify(answer.answer);
        const answerHash = crypto_1.default.createHash("sha256").update(hashInput).digest("hex");
        return {
            question: answer.questionId,
            selectedOption: answer.answer,
            answerHash: answerHash,
        };
    });
}
function verifySignature(message, walletAddress, signature) {
    const parsedMessage = typeof message === "string" ? message : JSON.stringify(message);
    const parsedSignature = typeof signature === "string" ? JSON.parse(signature) : signature;
    const verifyBody = {
        data: parsedMessage,
        publicKey: walletAddress,
        signature: parsedSignature,
    };
    const verifyResult = signerClient.verifyMessage(verifyBody);
    console.log("Result: ", verifyResult);
    return verifyResult;
}
async function pinToIPFS(hash) {
    try {
        const response = await axios_1.default.post("https://api.pinata.cloud/pinning/pinByHash", {
            hashToPin: hash,
            pinataMetadata: {
                name: "Pinned_Link",
            },
        }, {
            headers: {
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
            },
        });
        console.log("SUCCESS: Pinned CID:", hash);
        return response.data.IpfsHash;
    }
    catch (error) {
        console.error("Error pinning to IPFS:", error);
        throw error;
    }
}
async function extractImageCid(text) {
    const markdownLinkRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    const cidRegex = /\/ipfs\/(Qm[1-9A-Za-z]{44}|baf[1-9A-Za-z]{56})/;
    const matches = [...text.matchAll(markdownLinkRegex)];
    for (const match of matches) {
        console.log("Found Markdown Link: ", match[1]);
        const url = match[1];
        const cidMatch = url.match(cidRegex);
        if (cidMatch && cidMatch[1]) {
            console.log("Found CID: ", cidMatch[1]);
            const cid = cidMatch[1];
            // Pinning by CID feature was moved in paid plan
            // await pinToIPFS(cid);
        }
    }
}
async function processQuestion(question) {
    console.log("Processing Question: ", question.text);
    // Process images in the question text
    await extractImageCid(question.text);
    // Process question options
    if (question.options && Array.isArray(question.options)) {
        question.options = await Promise.all(question.options.map(async (option) => {
            // Process images in the option text
            await extractImageCid(option.text);
            return option;
        }));
    }
    return question;
}
function isExamCompleted(exam) {
    const startTime = new Date(exam.startDate);
    const endTime = startTime.getTime() + exam.duration * 60000;
    const currentDateTime = new Date().getTime();
    return endTime < currentDateTime;
}
function checkExamTimes(exam) {
    const now = new Date().getTime();
    const startTime = new Date(exam.startDate).getTime();
    const endTime = startTime + exam.duration * 60000;
    if (now < startTime) {
        return {
            valid: false,
            message: "Exam has not started yet",
        };
    }
    if (now > endTime) {
        return {
            valid: false,
            message: "Exam has ended",
        };
    }
    return { valid: true };
}
function calculateScore(userAnswers, answerKey) {
    let correctAnswers = 0;
    userAnswers.forEach((userAnswer) => {
        const question = answerKey.find((key) => key.questionId.toString() === userAnswer.questionId.toString());
        if (question && question.correctAnswer.toString() === userAnswer.answer.toString()) {
            correctAnswers++;
        }
    });
    const score = ((correctAnswers / answerKey.length) * 100).toFixed(2).toString();
    return { score, correctAnswers };
}
