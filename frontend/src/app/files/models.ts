import { RequestError } from "../../api/models";

export interface CanRaiseError {
	onErrorSet: (errorMessage: RequestError | null) => void;
}

export interface FileItemProps extends CanRaiseError {
	id: number;
	name: string;
	size: number;
	selected: boolean;
	uploadDate: Date;
	parentDirectoryId: number | null;
	isDirectory: boolean;
	onDirectoryClicked: () => void;
	onFileSelect: () => void;
	onFileNameChanged: () => void;
}

export interface CreateDirectoryFormProps extends CanRaiseError {
	parentDirectoryId: number | null;
	onDirectoryCreated: () => void;
	onCancel: () => void;
}

export interface UploadFileFormProps extends CanRaiseError  {
	parentDirectoryId: number | null;
	onFileUploaded: () => Promise<void>;
}

export interface DirectoryChainItem {
	id: number | null;
	name: string;
}
