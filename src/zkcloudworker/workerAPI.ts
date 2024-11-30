import axios from "axios";
import { IndexedMapSerialized } from "zkcloudworker";
import { JsonProof } from "o1js";
interface InitWinnerMapParams {
	contractAddress: string;
	[key: string]: any;
}

interface AddWinnerParams {
	contractAddress: string;
	winner: string;
	previousProof: string;
	serializedPreviousMap: string;
	[key: string]: any;
}

interface PayoutWinnersParams {
	contractAddress: string;
	winner1: string;
	winner2: string;
	winner1Proof: string;
	winner2Proof: string;
	[key: string]: any;
}

interface Winner {
	publicKey: string;
	reward: string;
}

interface AddWinnersAndPayoutParams {
	previousProof: JsonProof;
	serializedStringPreviousMap: IndexedMapSerialized;
	contractAddress: string;
	winner1: Winner;
	winner2: Winner;
}

interface AddWinnersAndPayoutResult {
	auxiliaryOutput?: string;
	proof?: string;
}

interface CalculateScoreParams {
	userAnswers: {
		answers: string[];
	};
	correctAnswers: {
		answers: string[];
	};
}

export async function initWinnerMap(params: InitWinnerMapParams): Promise<{
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction?: string;
	auxiliaryOutput?: IndexedMapSerialized;
	proof?: JsonProof;
}> {
	let result = await execute({
		task: "initWinnerMap",
		args: params,
		metadata: "init winner map test",
	});
	let jobResult = await waitForJobResult({
		jobId: result.jobId,
		printLogs: true,
	});
	return { isPrepared: true, ...JSON.parse(jobResult.result.result) };
}

export async function addWinner(params: string): Promise<{
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction?: string;
	auxiliaryOutput?: IndexedMapSerialized;
	proof?: JsonProof;
}> {
	console.log("addWinner", params);

	let result = await execute({
		task: "addWinner",
		args: params,
		metadata: "add winner test",
	});

	let jobResult = await waitForJobResult({
		jobId: result.jobId,
		printLogs: true,
	});
	if (jobResult.result.result === undefined) {
		console.error(jobResult.result);
		throw new Error("No result from addWinner");
	}
	return { isPrepared: true, ...JSON.parse(jobResult.result.result) };
}

export async function payoutWinners(params: string): Promise<{
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction?: string;
	payoutParams?: string;
}> {
	console.log("payoutWinners", params);
	const response = await execute({
		task: "payoutWinners",
		args: params,
		metadata: "payout winners test",
	});

	let jobResult = await waitForJobResult({
		jobId: response.jobId,
		printLogs: true,
	});

	console.log(`zkCloudWorker answer:`, jobResult);
	const jobId = jobResult.jobId;
	console.log(`jobId:`, jobId);
	return { isPrepared: true, ...JSON.parse(jobResult.result.result) };
}

export async function addWinnersAndPayout(params: AddWinnersAndPayoutParams) {
	const addWinnerResult = await addWinner(
		JSON.stringify({
			previousProof: params.previousProof,
			serializedStringPreviousMap: params.serializedStringPreviousMap,
			contractAddress: params.contractAddress,
			winner: params.winner1,
		})
	);

	const addSecondWinnerResult = await addWinner(
		JSON.stringify({
			previousProof: addWinnerResult.proof,
			serializedStringPreviousMap: addWinnerResult.auxiliaryOutput,
			contractAddress: params.contractAddress,
			winner: params.winner2,
		})
	);

	const payoutWinnersResult = await payoutWinners(
		JSON.stringify({
			contractAddress: params.contractAddress,
			winner1: params.winner1.publicKey,
			winner2: params.winner2.publicKey,
			winner1Proof: addWinnerResult.proof,
			winner2Proof: addSecondWinnerResult.proof,
		})
	);
	return { addSecondWinnerResult };
}

export async function initWinnerMapAddTwoWinnersAndPayout(params: string): Promise<{
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction?: string;
	auxiliaryOutput?: IndexedMapSerialized;
	proof?: JsonProof;
}> {
	const { contractAddress, winner1, winner2 } = JSON.parse(params);
	const initWinnerMapResult = await initWinnerMap({ contractAddress });
	console.log("initWinnerMapResult is here:", initWinnerMapResult);
	const addTwoWinnersAndPayoutResult = await addWinnersAndPayout({
		previousProof: initWinnerMapResult.proof!,
		serializedStringPreviousMap: initWinnerMapResult.auxiliaryOutput!,
		contractAddress,
		winner1,
		winner2,
	});
	return { isPrepared: true, ...addTwoWinnersAndPayoutResult };
}

export async function calculateScore(params: CalculateScoreParams): Promise<{
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction?: string;
	score?: string;
	proof?: JsonProof;
}> {
	console.log("calculateScore", params);

	let result = await execute({
		task: "calculateScore",
		args: JSON.stringify(params),
		metadata: "calculate score test",
	});

	let jobResult = await waitForJobResult({
		jobId: result.jobId,
		printLogs: true,
	});

	return { isPrepared: true, ...JSON.parse(jobResult.result.result) };
}

async function zkCloudWorkerRequest(params: {
	command: string;
	task?: string;
	transactions?: string[];
	args?: string;
	metadata?: string;
	mode?: string;
	jobId?: string;
}) {
	const { command, task, transactions, args, metadata, mode, jobId } = params;
	const chain = process.env.CHAIN;
	if (chain === undefined) throw new Error("Chain is undefined");

	const apiData = {
		auth: process.env.ZKCW_AUTH,
		command: command,
		jwtToken: process.env.ZKCW_JWT,
		data: {
			task,
			transactions: transactions ?? [],
			args,
			repo: process.env.ZKCW_REPO || "choz-worker",
			developer: process.env.ZKCW_DEVELOPER || "BlocksOnChains",
			metadata,
			mode: mode ?? "sync",
			jobId,
		},
		chain,
	};
	const endpoint = process.env.ZKCW_ENDPOINT + chain;
	const response = await axios.post(endpoint, apiData);
	return response.data;
}

export async function execute(params: {
	task: string;
	transactions?: string[];
	args: any;
	metadata: string;
	mode?: string;
}): Promise<any> {
	const { task, transactions = [], args, metadata, mode = "async" } = params;

	const answer = await zkCloudWorkerRequest({
		command: "execute",
		task,
		transactions,
		args: typeof args === "string" ? args : JSON.stringify(args),
		metadata,
		mode,
	});

	return answer;
}

export async function waitForJobResult(params: { jobId: string; printLogs?: boolean }): Promise<any> {
	const { jobId, printLogs = false } = params;
	let result;
	let answer;

	while (true) {
		answer = await zkCloudWorkerRequest({
			command: "jobResult",
			jobId,
		});

		if (printLogs) {
			console.log(`jobResult api call result:`, answer);
		}

		if (answer.jobStatus === "failed") {
			return { success: false, result: answer };
		}

		if (answer.result !== undefined) {
			return { success: true, result: answer };
		}

		await sleep(5000);
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
