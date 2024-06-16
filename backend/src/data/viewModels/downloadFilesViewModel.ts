import { Transform } from "class-transformer";

export class DownloadFileViewModel {
	@Transform(({ value }) => [...new Set(value.filter(Number.isInteger))] )
	readonly fileIds: number[];
}
