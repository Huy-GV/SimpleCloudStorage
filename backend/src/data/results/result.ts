import { ResultCode } from "./resultCode";

abstract class BaseResult {
	constructor(
		readonly code: ResultCode,
		readonly statusText: string = ''
	) { }

	get successful(): boolean {
		return this.code == ResultCode.Success;
	}
}

export class DataResult<T> extends BaseResult {
	private readonly resultData: T | null = null;

	constructor(
		code: ResultCode,
		data?: T | null,
		statusText: string = ''
	) {
		super(code, statusText);

		if (this.successful) {
			if (data == null || data == undefined) {
				throw new Error('Data must not be null or undefined when result code is Success');
			} else {
				this.resultData = data;
			}
		}
	}

	get data(): T | null {
		return this.resultData;
	}
}

export class EmptyResult extends BaseResult {
	constructor(
		readonly code: ResultCode,
		readonly statusText: string = ''
	) {
		super(code, statusText);
	}
}

export type Result<T = void> = T extends void
	? EmptyResult
	: DataResult<T>
