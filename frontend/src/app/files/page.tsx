"use client"
import { useEffect, useState } from "react"
import { JWT_STORAGE_KEY, SERVER_URL } from "../constants";
import { FileListItem } from "./fileListItem";
import { useRouter } from "next/navigation";
import { FileUploadForm } from "./fileUploadForm";
import styles from './files.module.css'
import { FileItemData } from "./definitions";

export default function Page() {
	const router = useRouter();

	const [fileItemList, setFileItemList] = useState<FileItemData[]>([]);
	const [error, setError] = useState<string>('');
	const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
	const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);

	const fetchAllFiles = async (): Promise<FileItemData[] | null> => {
		const response = await fetch(`${SERVER_URL}/files/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY]}`
			}
		});

		if (!response.ok) {
			setError("Failed to fetch files");

			if (response.status === 401 || response.status === 403) {
				router.push('/auth');
			}

			return null;
		}

		const files: FileItemData[] = await response.json();
		return files;
	}

	const reloadFileList = (): void => {
		fetchAllFiles()
			.then((files) => setFileItemList(files || []))
	}

	reloadFileList();

	const handleFileSelected = (fileId: number) => {
		const newFileSet = new Set(selectedFiles);
		if (selectedFiles.has(fileId)) {
			newFileSet.delete(fileId);
			setSelectedFiles(newFileSet);
		} else {
			newFileSet.add(fileId);
			setSelectedFiles(newFileSet);
		}
	}

	const handleFileDelete = async () => {
		const response = await fetch(`${SERVER_URL}/files`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY]}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				fileIds: Array.from(selectedFiles)
			})
		});

		if (!response.ok) {
			setError("Failed to delete files");

			if (response.status === 401 || response.status === 403) {
				router.push('/auth');
			}

			return null;
		}

		setSelectedFiles(new Set());
		setShouldRefresh(!shouldRefresh);
	}

	const handleFileDownload = () => {

	}

	const onFileUploaded = async () => {
		setShouldRefresh(!shouldRefresh);
	}

	useEffect(() => {
		reloadFileList();
	}, [shouldRefresh])

	return (
		<main className={styles.fileListContainer}>
			<FileUploadForm onFileUploaded={onFileUploaded}></FileUploadForm>
			<div>
				<button className={styles.fileDownloadBtn} onClick={handleFileDownload}>Download</button>
				<button className={styles.fileDeleteBtn} onClick={handleFileDelete}>Delete</button>
				{/* <button>Share</button> */}
			</div>
			{
				error && <p>Error: {error}</p>
			}
			<table className={styles.fileTable}>
				<thead>
					<tr>
						<th className={styles.nameCol}>Selected</th>
						<th className={styles.nameCol}>File name</th>
						<th className={styles.uploadDateCol}>Upload date</th>
					</tr>
				</thead>
				<tbody>
				{
					fileItemList.map(item => (
						<FileListItem
							onFileSelect={() => handleFileSelected(item.id)}
							key={item.id}
							name={item.name}
							id={item.id}
							// uploadDate={item.uploadDate}
						>
						</FileListItem>
					))
				}
				</tbody>
			</table>
		</main>
	)
}
