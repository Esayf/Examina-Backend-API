import { Document, Model } from "mongoose";

declare module "mongoose" {
	interface AggregatePaginateResult<T> {
		docs: T[];
		totalDocs: number;
		limit: number;
		page?: number;
		totalPages: number;
		nextPage?: number;
		prevPage?: number;
		pagingCounter: number;
		hasPrevPage: boolean;
		hasNextPage: boolean;
		meta?: any;
	}

	interface AggregatePaginateModel<T extends Document> extends Model<T> {
		aggregatePaginate(
			query: any,
			options?: any,
			callback?: (err: any, result: AggregatePaginateResult<T>) => void
		): Promise<AggregatePaginateResult<T>>;
	}

	interface Aggregate<T> {
		exec(): Promise<T[]>;
	}
}
