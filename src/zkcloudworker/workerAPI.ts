import axios from "axios";
import { blockchain, IndexedMapSerialized, zkCloudWorkerClient } from "zkcloudworker";
import { JsonProof } from "o1js";
export interface InitWinnerMapParams {
	contractAddress: string;
	[key: string]: any;
}

export interface AddWinnerParams {
	contractAddress: string;
	winner: string;
	previousProof: string;
	serializedPreviousMap: string;
	[key: string]: any;
}

export interface PayoutWinnersParams {
	contractAddress: string;
	winner1: string;
	winner2: string;
	winner1Proof: string;
	winner2Proof: string;
	[key: string]: any;
}

export interface Winner {
	publicKey: string;
	reward: string;
}

export interface AddWinnersAndPayoutParams {
	previousProof: JsonProof;
	serializedStringPreviousMap: IndexedMapSerialized;
	contractAddress: string;
	winner1: Winner;
	winner2: Winner;
}

export interface AddOneWinnerAndPayoutParams {
	previousProof: JsonProof;
	serializedStringPreviousMap: IndexedMapSerialized;
	contractAddress: string;
	winner: Winner;
}

export interface AddWinnersAndPayoutResult {
	auxiliaryOutput?: string;
	proof?: string;
}

export interface CalculateScoreParams {
	userAnswers: {
		answers: string[];
	};
	correctAnswers: {
		answers: string[];
	};
}

const workerAPI = new zkCloudWorkerClient({ jwt: process.env.ZKCW_JWT!, chain: process.env.CHAIN! as blockchain });

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
	let jobResult = await workerAPI.waitForJobResult({
		jobId: result.jobId,
		printLogs: true,
	});
	console.log("jobResult", jobResult.result);
	if (jobResult.result.result === undefined) {
		console.error(jobResult.error);
		throw new Error("No result from initWinnerMap:" + jobResult.error);
	}
	return { isPrepared: true, ...JSON.parse(jobResult.result.result) };
}

export async function addWinner(params: string): Promise<{
	isError?: boolean;
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction: string;
	auxiliaryOutput: IndexedMapSerialized;
	proof: JsonProof;
}> {
	console.log("addWinner", params);

	let result = await execute({
		task: "addWinner",
		args: params,
		metadata: "add winner test",
	});

	let jobResult = await workerAPI.waitForJobResult({
		jobId: result.jobId,
		printLogs: true,
	});
	if (jobResult.result.result === undefined) {
		console.error(jobResult.result);
		throw new Error("No result from addWinner");
	}
	return { isPrepared: true, ...JSON.parse(jobResult.result.result) };
}

export async function payoutOneWinner(params: string): Promise<{
	isPrepared: boolean;
	isSent: boolean;
}> {
	const response = await execute({
		task: "payoutOneWinner",
		args: params,
		metadata: "payout one winner test",
	});
	let jobResult = await workerAPI.waitForJobResult({
		jobId: response.jobId,
		printLogs: true,
	});
	if (jobResult.result.result === undefined) {
		throw new Error("Error when payout one winner:" + jobResult.error);
	}
	const { success, tx, error } = JSON.parse(jobResult.result.result);
	if (error) {
		console.error("Error when payout one winner:" + error);
	}
	return { isPrepared: true, isSent: success };
}

export async function payoutWinners(params: string): Promise<{
	isPrepared: boolean;
	isSent: boolean;
}> {
	console.log("payoutWinners", params);
	const response = await execute({
		task: "payoutWinners",
		args: params,
		metadata: "payout winners test",
	});

	let jobResult = await workerAPI.waitForJobResult({
		jobId: response.jobId,
		printLogs: true,
	});

	console.log(`zkCloudWorker answer:`, jobResult);
	const jobId = response.jobId;
	console.log(`jobId:`, jobId);
	if (jobResult.result.result === undefined) {
		console.error(jobResult.error);
		throw new Error("No result from payoutWinners:" + jobResult.error);
	}
	const { success, tx, error } = JSON.parse(jobResult.result.result);
	if (error) {
		console.error("Error when payout winners:" + error);
	}
	return {
		isPrepared: true,
		isSent: success,
	};
}

export async function addWinnersAndPayout(params: AddWinnersAndPayoutParams) {
	try {
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
		return { ...addSecondWinnerResult };
	} catch (error) {
		console.error("Error adding winners and payout:", error);
		return {
			isError: true,
			isPrepared: false,
			serializedTransaction: "",
			auxiliaryOutput: {} as IndexedMapSerialized,
			proof: {} as JsonProof,
		};
	}
}
export async function initWinnerMapAddOneWinnerAndPayout(params: string): Promise<{
	isError?: boolean;
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction?: string;
	auxiliaryOutput?: IndexedMapSerialized;
	proof?: JsonProof;
}> {
	try {
		const { contractAddress, winner } = JSON.parse(params);
		const initWinnerMapResult = await initWinnerMap({ contractAddress });
		console.log("initWinnerMapResult is here:", initWinnerMapResult);
		const addOneWinnerAndPayoutResult = await addOneWinnerAndPayout({
			previousProof: initWinnerMapResult.proof!,
			serializedStringPreviousMap: initWinnerMapResult.auxiliaryOutput!,
			contractAddress,
			winner,
		});
		return addOneWinnerAndPayoutResult;
	} catch (error) {
		console.error("Error adding one winner and payout:", error);
		return { isError: true, isPrepared: false };
	}
}

export async function addOneWinnerAndPayout(params: AddOneWinnerAndPayoutParams) {
	const addWinnerResult = await addWinner(
		JSON.stringify({
			previousProof: params.previousProof,
			serializedStringPreviousMap: params.serializedStringPreviousMap,
			contractAddress: params.contractAddress,
			winner: params.winner,
		})
	);

	const payoutOneWinnerResult = await payoutOneWinner(
		JSON.stringify({
			contractAddress: params.contractAddress,
			winner: params.winner.publicKey,
			proof: addWinnerResult.proof,
		})
	);
	return payoutOneWinnerResult;
}

export async function initWinnerMapAddTwoWinnersAndPayout(params: string): Promise<{
	isError?: boolean;
	isPrepared: boolean;
	transaction?: string;
	fee?: number;
	memo?: string;
	serializedTransaction: string;
	auxiliaryOutput: IndexedMapSerialized;
	proof: JsonProof;
}> {
	try {
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
		if (addTwoWinnersAndPayoutResult.isError) {
			return {
				isError: true,
				isPrepared: false,
				serializedTransaction: "",
				auxiliaryOutput: {} as IndexedMapSerialized,
				proof: {} as JsonProof,
			};
		}
		return {
			isPrepared: true,
			serializedTransaction: addTwoWinnersAndPayoutResult.serializedTransaction,
			auxiliaryOutput: addTwoWinnersAndPayoutResult.auxiliaryOutput,
			proof: addTwoWinnersAndPayoutResult.proof,
		};
	} catch (error) {
		console.error("Error adding two winners and payout:", error);
		throw error;
	}
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

	let jobResult = await workerAPI.waitForJobResult({
		jobId: result.jobId,
		printLogs: true,
	});
	if (jobResult.result.result === undefined) {
		console.error(jobResult.error);
		throw new Error("No result from calculateScore:" + jobResult.error);
	}
	return { isPrepared: true, ...JSON.parse(jobResult.result.result) };
}

async function zkCloudWorkerRequest(params: {
	task: string;
	transactions?: string[];
	args: string;
	metadata?: string;
	mode?: string;
	jobId?: string;
}) {
	const { task, transactions, args, metadata, mode, jobId } = params;
	const chain = process.env.CHAIN;
	if (chain === undefined) throw new Error("Chain is undefined");

	return await workerAPI.execute({
		task,
		transactions: transactions ?? [],
		args,
		metadata,
		mode: mode ?? "async",
		developer: "BlocksOnChain",
		repo: "choz-worker",
	});
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
		task,
		transactions,
		args: typeof args === "string" ? args : JSON.stringify(args),
		metadata,
		mode,
	});

	return answer;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
