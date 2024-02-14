export class FileDto {
	constructor(
		readonly id: number,
		readonly name: string,
		readonly uploadDate: Date,
		readonly size: number,
		readonly isDirectory: Boolean,
	) { }
}
