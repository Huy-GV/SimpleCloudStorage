"use client"
import { useEffect, useRef, useState } from "react"
import { JWT_STORAGE_KEY, SERVER_URL } from "../constants";
import { FileListItem } from "./fileListItem";
import { useRouter } from "next/navigation";
import { FileUploadForm } from "./fileUploadForm";
import styles from './files.module.css'
import { FileItemData } from "./definitions";

export default function Page() {
	const router = useRouter();

	const downloadedFileRef = useRef<HTMLAnchorElement>(null);
	const [fileItemList, setFileItemList] = useState<FileItemData[]>([]);
	const [error, setError] = useState<string>('');
	const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());

	const fetchAllFiles = async (): Promise<FileItemData[] | null> => {
		const response = await fetch(`${SERVER_URL}/files/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY] ?? ''}`
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

	const reloadFileList = async (): Promise<void> => {
		const files = await fetchAllFiles();
		setFileItemList(files || []);
	}

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
		await reloadFileList();
	}

	const clickDownloadLink = (blob: Blob) => {
		const downloadAnchor = downloadedFileRef.current!;

		const url = URL.createObjectURL(blob);
		downloadAnchor.setAttribute('href', url)
		downloadAnchor.setAttribute('download', 'downloaded.zip')

		downloadAnchor.click();

		URL.revokeObjectURL(url);
		downloadAnchor.removeAttribute('href')
		downloadAnchor.removeAttribute('download')
	}

	const handleFileDownload = async () => {
		const jwt = localStorage[JWT_STORAGE_KEY];
		if (!jwt) {
			router.push('/auth');
		}

		const response = await fetch(`${SERVER_URL}/files/download`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${jwt}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				fileIds: Array.from(selectedFiles)
			})
		})

		if (!response.ok) {
			setError("Failed to download files");

			if (response.status === 401 || response.status === 403) {
				router.push('/auth');
			}

			return null;
		}

		const blob = await response.blob();
		clickDownloadLink(blob);

		setSelectedFiles(new Set());
	}

	const handleFilesDeselected = () => {
		setSelectedFiles(new Set());
	}

	const onFileUploaded = async () => {
		await reloadFileList();
	};

	const onFileNameChanged = async () => {
		await reloadFileList();
	};

	useEffect(() => {
		reloadFileList();
	}, []);

	return (
		<main className={styles.fileListContainer}>
			<h1>My Files</h1>
			<div className={styles.btnMenu}>
				<FileUploadForm onFileUploaded={onFileUploaded}></FileUploadForm>
				<button
					disabled={selectedFiles.size == 0}
					className={styles.fileDownloadBtn}
					onClick={handleFileDownload}>Download</button>
				<button
					disabled={selectedFiles.size == 0}
					className={styles.fileDeleteBtn}
					onClick={handleFileDelete}>Delete</button>
				<button
					className={selectedFiles.size != 0 ? styles.deselectFilesBtn : styles.hidden}
					onClick={handleFilesDeselected}>Deselect { selectedFiles.size }</button>

				<a ref={downloadedFileRef}></a>

				{/* <button>Share</button> */}
			</div>
			{
				error && <p>Error: {error}</p>
			}
			<table className={styles.fileTable}>
				<thead>
					<tr>
						<th className={styles.alignLeftCol}></th>
						<th className={styles.alignLeftCol}>Name</th>
						<th className={styles.alignLeftCol}>Size</th>
						<th className={styles.alignRightCol}>Upload Date</th>
					</tr>
				</thead>
				<tbody>
				{
					fileItemList.map(item => (
						<FileListItem
							onFileNameChanged={onFileNameChanged}
							onFileSelect={() => handleFileSelected(item.id)}
							key={item.id}
							name={item.name}
							id={item.id}
							size={item.size}
							selected={selectedFiles.has(item.id)}
							uploadDate={new Date(item.uploadDate)}
						>
						</FileListItem>
					))
				}
				</tbody>
			</table>
		</main>
	)
}
