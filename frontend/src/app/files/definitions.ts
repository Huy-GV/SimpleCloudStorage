export interface FileItemData {
	id: number;
	name: string;
	size: number;
	selected: boolean;
	uploadDate: Date;
	isDirectory: boolean;
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
