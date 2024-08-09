export interface HttpResult {
    rawResponse: Omit<Response, 'json'> | null;
    message: string;
}

export interface RequestError {
    statusCode: string;
    message: string;
}

export interface GetFilesResult extends HttpResult {
    files: FileItem[];
}

export interface FileItem {
	id: number;
	name: string;
	size: number;
	selected: boolean;
	uploadDate: Date;
	parentDirectoryId: number | null;
	isDirectory: boolean;
}
