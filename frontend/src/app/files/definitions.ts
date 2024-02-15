export interface FileItemData {
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

export interface CreateDirectoryFormProps {
	parentDirectoryId: number | null;
	onDirectoryCreated: () => void;
	onCancel: () => void;
}

export interface UploadFileFormProps {
	parentDirectoryId: number | null;
	onFileUploaded: () => Promise<void>;
}

export interface DirectoryChainItem {
	id: number | null;
	name: string;
}
