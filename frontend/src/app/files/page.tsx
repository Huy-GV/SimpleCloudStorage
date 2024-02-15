"use client"
import { useEffect, useRef, useState } from "react"
import { JWT_STORAGE_KEY, SERVER_URL } from "../constants";
import { FileListItem } from "./fileListItem";
import { useRouter } from "next/navigation";
import { FileUploadForm } from "./fileUploadForm";
import styles from './files.module.css'
import { DirectoryChainItem, FileItemData } from "./definitions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket, faChevronRight, faDownload, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CreateDirectoryForm } from "./createDirectoryForm";

export default function Page() {
	const router = useRouter();

	const downloadedFileRef = useRef<HTMLAnchorElement>(null);
	const [currentDirectoryId, setCurrentDirectoryId] = useState<number | null>(null);

	const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
	const [selectedDirectoryId, setSelectedDirectoryId] = useState<number | null>(null);

	const [fileItemMap, setFileItemMap] = useState<Map<number, FileItemData>>(new Map());
	const [directoryIds, setDirectoryIds] = useState<Set<number>>(new Set());

	const [directoryChain, setDirectoryChain] = useState<DirectoryChainItem[]>([]);

	const [error, setError] = useState<string>('');
	const [isCreateDirectoryFormDisplayed, setIsCreateDirectoryFormDisplayed] = useState<boolean>();

	const fetchAllFiles = async (directoryId: number | null): Promise<FileItemData[] | null> => {
		const url = directoryId == null
			? `${SERVER_URL}/files/`
			: `${SERVER_URL}/files/${directoryId}`;

		console.log(url)
		try {
			const response = await fetch(url, {
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
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	const reloadFileList = async (directoryId: number | null): Promise<void> => {
		const files = await fetchAllFiles(directoryId);
		setDirectoryIds(new Set(files?.filter(x => x.isDirectory).map(x => x.id)));
		setFileItemMap(new Map(files?.map(x => [x.id, x])) ?? new Map());
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

		if (newFileSet.size == 1) {
			const onlySelectedFileId = Array.from(newFileSet)[0];
			if (directoryIds.has(onlySelectedFileId)) {
				setSelectedDirectoryId(onlySelectedFileId)
			}
		} else {
			setSelectedDirectoryId(null);
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
		await reloadFileList(currentDirectoryId);
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

	const handleDirectoryCreationFormDisplayed = () => {
		setIsCreateDirectoryFormDisplayed(true)
	}

	const deselectAllFiles = () => {
		// deselect all files and directories
		setSelectedDirectoryId(null);
		setSelectedFiles(new Set());
	}

	const handleDirectoryEntered = async () => {
		// set the current directory to the previously selected one
		console.log('current selected dir id is ', selectedDirectoryId)
		setCurrentDirectoryId(selectedDirectoryId);

		deselectAllFiles();

		// add the directory to the chain
		setDirectoryChain([
			...directoryChain,
			{
				id: selectedDirectoryId,
				name: fileItemMap.get(selectedDirectoryId!)?.name ?? 'unknown'
			}
		]);

		await reloadFileList(selectedDirectoryId);
	}

	const handleDirectoryLinkClicked = async (directoryId: number | null) => {
		if (directoryId == currentDirectoryId) {
			return;
		}

		setCurrentDirectoryId(directoryId);
		deselectAllFiles();

		setDirectoryChain(prev => {
			const index = prev.map(x => x.id).indexOf(directoryId);
			if (index === -1) {
				return prev;
			}

			return prev.slice(0, index + 1);
		})

		await reloadFileList(directoryId);
	}

	const onFileUploaded = async () => {
		console.log('current dir id is ', currentDirectoryId)
		await reloadFileList(currentDirectoryId);
	};

	const onFileNameChanged = async () => {
		await reloadFileList(currentDirectoryId);
	};

	const onDirectoryCreated = async () => {
		await reloadFileList(currentDirectoryId);
		setIsCreateDirectoryFormDisplayed(false);
	};

	const onDirectoryCreationCancelled = async () => {
		setIsCreateDirectoryFormDisplayed(false);
	};

	useEffect(() => {
		reloadFileList(currentDirectoryId);
		setDirectoryChain([{ id: null, name: 'root' }]);
	}, []);

	return (
		<main className={styles.fileListContainer}>
			<h1>My Files</h1>
			<div className={styles.btnMenu}>
				<button
					className={styles.selectFileToUploadBtn}
					onClick={handleDirectoryCreationFormDisplayed}>
					<FontAwesomeIcon icon={faPlus} />
					<span className={styles.btnLabel}>Add Folder</span>
				</button>
				<FileUploadForm
					parentDirectoryId={currentDirectoryId}
					onFileUploaded={onFileUploaded}
				>
				</FileUploadForm>
				<button
					disabled={selectedFiles.size == 0}
					className={styles.fileDownloadBtn}
					onClick={handleFileDownload}>
					<FontAwesomeIcon icon={faDownload} />
					<span className={styles.btnLabel}>Download</span>
				</button>
				<button
					disabled={selectedFiles.size == 0}
					className={styles.fileDeleteBtn}
					onClick={handleFileDelete}>
					<FontAwesomeIcon icon={faTrash} />
					<span className={styles.btnLabel}>Delete</span>
				</button>
				<button
					disabled={selectedDirectoryId == null}
					className={styles.fileDeleteBtn}
					onClick={handleDirectoryEntered}>
					<FontAwesomeIcon icon={faArrowRightToBracket} />
					<span className={styles.btnLabel}>Enter</span>
				</button>
				<a ref={downloadedFileRef}></a>

				{/* <button>Share</button> */}
			</div>
			{
				error && <p className={styles.errorMessage}>Error: {error}</p>
			}

			<div className={styles.breadcrumbMenu}>
				{
					directoryChain.map(x => (
						(
							<>
								<FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>
								<button
									key={x.id}
									onClick={() => handleDirectoryLinkClicked(x.id)}>
									{ x.name }
								</button>
							</>

						)
					))
				}
			</div>

			<table className={styles.fileTable}>
				<thead>
					<tr>
						<th className={styles.alignLeftCol}>
							<button
								className={selectedFiles.size != 0 ? styles.deselectFilesBtn : styles.hidden}
								onClick={handleFilesDeselected}>Deselect {selectedFiles.size}
							</button>
						</th>

						{/*
						a <p/> tag is used to ensure the height does not change when the Deselect button is toggled
						*/}
						<th className={styles.alignLeftCol}><p>Name</p></th>
						<th className={styles.alignLeftCol}>Size</th>
						<th className={styles.alignLeftCol}>Type</th>
						<th className={styles.alignRightCol}>Upload Date</th>
					</tr>
				</thead>
				<tbody>
					{
						isCreateDirectoryFormDisplayed && (
							<CreateDirectoryForm
								onDirectoryCreated={onDirectoryCreated}
								onCancel={onDirectoryCreationCancelled}
								parentDirectoryId={currentDirectoryId}
							>
							</CreateDirectoryForm>
						)
					}
					{
						Array.from(fileItemMap.values()).map(item => (
							<FileListItem
								onFileNameChanged={onFileNameChanged}
								onFileSelect={() => handleFileSelected(item.id)}
								key={item.id}
								name={item.name}
								id={item.id}
								size={item.size}
								selected={selectedFiles.has(item.id)}
								uploadDate={new Date(item.uploadDate)}
								isDirectory={item.isDirectory}
							>
							</FileListItem>
						))
					}
				</tbody>
			</table>
		</main>
	)
}
