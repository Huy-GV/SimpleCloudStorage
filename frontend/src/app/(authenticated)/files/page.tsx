"use client"
import { useCallback, useEffect, useRef, useState } from 'react'
import FileListItem from "./fileListItem";
import { useRouter } from 'next/navigation';
import FileUploadForm from "./fileUploadForm";
import { DirectoryChainItem } from "./types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import CreateDirectoryForm from "./createDirectoryForm";
import { sleep } from '@/utilities';
import { deleteFiles, downloadFiles, fetchAllFiles } from '@api/fileApis';
import { FileItem, RequestError } from '@api/models';
import FileBreadcrumbMenu from './fileBreadcrumbMenu';

export default function Page() {

	const downloadedFileRef = useRef<HTMLAnchorElement>(null);
	const [currentDirectoryId, setCurrentDirectoryId] = useState<number | null>(null);

	const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());

	const [fileItemMap, setFileItemMap] = useState<Map<number, FileItem>>(new Map());

	const [directoryChain, setDirectoryChain] = useState<DirectoryChainItem[]>([]);

	const [error, setError] = useState<RequestError | null>(null);
	const [isCreateDirectoryFormDisplayed, setIsCreateDirectoryFormDisplayed] = useState<boolean>();

	const router = useRouter();
	const reloadFileList = useCallback(async (directoryId: number | null) => {
		const result = await fetchAllFiles(directoryId);
		if (!result.rawResponse?.ok) {
			setError({
				message: result.message,
				statusCode: result.rawResponse?.status.toString() ?? 'unknown'
			});
		} else {
			setFileItemMap(new Map(result.files.map(x => [x.id, x])))
			setError(null);
		}
	}, [setFileItemMap]);

	useEffect(() => {
		if (error && (error.statusCode === '401' || error.statusCode === '403')) {
			sleep(1500).then(() => router.push('/auth'));
		}
	}, [error, router]);

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
		const result = await deleteFiles(selectedFiles);
		if (!(result.rawResponse?.ok ?? false)) {
			setError({
				message: result.message,
				statusCode: result.rawResponse?.status.toString() ?? 'unknown'
			});
		} else {
			setError(null);
			setSelectedFiles(new Set());
			await reloadFileList(currentDirectoryId);
		}
	}

	const clickDownloadLink = (blob: Blob) => {
		const downloadAnchor = downloadedFileRef.current!;

		const url = URL.createObjectURL(blob);
		downloadAnchor.setAttribute('href', url)
		downloadAnchor.setAttribute('download', `simple-cloud-storage-${new Date().toISOString()}.zip`)

		downloadAnchor.click();

		URL.revokeObjectURL(url);
		downloadAnchor.removeAttribute('href')
		downloadAnchor.removeAttribute('download')
	}

	const handleFileDownload = async () => {
		const result = await downloadFiles(selectedFiles);
		if (!result.rawResponse?.ok ) {
			setError({
				message: result.message,
				statusCode: result.rawResponse?.status.toString() ?? 'unknown'
			});
		} else {
			const blob = await result.rawResponse.blob();
			clickDownloadLink(blob);
			setError(null);
		}
	}

	const handleFilesDeselected = () => {
		setSelectedFiles(new Set());
	}

	const handleDirectoryCreationFormDisplayed = () => {
		setIsCreateDirectoryFormDisplayed(true)
	}

	const handleDirectoryEntered = async (selectedDirectoryId: number) => {
		// set the current directory to the previously selected one
		setCurrentDirectoryId(selectedDirectoryId);

		setSelectedFiles(new Set());

		// add the directory to the chain
		setDirectoryChain(currentDirectoryChain => {
			return  [
				...currentDirectoryChain,
				{
					id: selectedDirectoryId,
					name: fileItemMap.get(selectedDirectoryId!)!.name
				}
			]
		});

		await reloadFileList(selectedDirectoryId);
	}

	const handleDirectoryLinkClicked = async (selectedDirectoryId: number | null) => {
		if (selectedDirectoryId == currentDirectoryId) {
			await reloadFileList(selectedDirectoryId);
			return;
		}

		setCurrentDirectoryId(selectedDirectoryId);
		setSelectedFiles(new Set());

		setDirectoryChain(currentChain => {
			const index = currentChain.map(x => x.id).indexOf(selectedDirectoryId);
			return index === -1 ? currentChain : currentChain.slice(0, index + 1);
		})

		await reloadFileList(selectedDirectoryId);
	}

	const onFileUploaded = async () => {
		await reloadFileList(currentDirectoryId);
	};

	const onFileNameChanged = async () => {
		await reloadFileList(currentDirectoryId);
	};

	const handleDirectoryCreated = async () => {
		await reloadFileList(currentDirectoryId);
		setIsCreateDirectoryFormDisplayed(false);
	};

	const handleErrorSet = (error: RequestError | null) => {
		setError(error);
	}

	const handleDirectoryCreationCancelled = async () => {
		setIsCreateDirectoryFormDisplayed(false);
	};

	useEffect(() => {
		reloadFileList(null)
		  	.then(() => setDirectoryChain([{ id: null, name: 'Home' }]));
	}, [reloadFileList, setDirectoryChain]);

	return (
		<main className='flex flex-col w-screen sm:w-11/12 md:w-11/12 xl:w-3/5 mx-auto mb-16'>
			<h1 className='text-4xl mb-3 mx-2'>My Files</h1>
			<FileBreadcrumbMenu directoryChain={directoryChain} onClick={handleDirectoryLinkClicked} />
			<div className='flex flex-row gap-2 mb-4 m-4 pt-4 flex-wrap border-t border-slate-300'>
				<button
					className="bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer disabled:hover:cursor-default disabled:opacity-50 font-medium hover:bg-blue-900 transition-all duration-200 w-full sm:w-fit"
					onClick={handleDirectoryCreationFormDisplayed}>
					<FontAwesomeIcon icon={faPlus} />
					<span className='ml-2'>Add Folder</span>
				</button>
				<FileUploadForm
					parentDirectoryId={currentDirectoryId}
					onFileUploaded={onFileUploaded}
					onErrorSet={handleErrorSet}/>
				<button
					disabled={selectedFiles.size == 0}
					className="bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer disabled:hover:cursor-default disabled:opacity-50 font-medium hover:bg-blue-900 transition-all duration-200 w-full sm:w-fit "
					onClick={handleFileDownload}>
					<FontAwesomeIcon icon={faDownload} />
					<span className='ml-2'>Download</span>
				</button>
				<button
					disabled={selectedFiles.size == 0}
					className="bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer disabled:hover:cursor-default disabled:opacity-50 font-medium hover:bg-blue-900 transition-all duration-00 w-full sm:w-fit"
					onClick={handleFileDelete}>
					<FontAwesomeIcon icon={faTrash} />
					<span className='ml-2'>Delete</span>
				</button>
				<a ref={downloadedFileRef}></a>
			</div>
			{
				error &&
				<p className='text-red-700 bg-red-50 p-3 m-4'>
					{error.message}
				</p>
			}

			<table className='border-collapse table-fixed mx-auto w-full'>
				<thead>
					<tr>
						<th className='text-left h-full w-1/6 sm:w-1/12'>
							<button
								className={`bg-gray-300 my-1 p-2 rounded-md
									${selectedFiles.size != 0
										? 'visible'
										: 'invisible'
									}`
								}
								onClick={handleFilesDeselected}>
								<FontAwesomeIcon icon={faXmark}/>
								<span className='ml-2 sm:ml-3 sm:text-sm'>{selectedFiles.size}</span>
							</button>
						</th>

						<th className='sm:w-4/12 md:text-base md:w-5/12 lg:w-5/12 w-4/6 text-left'>Name</th>
						<th className='sm:w-2/12 md:text-base md:w-2/12 lg:w-2/12 text-right sm:text-left pr-4 md:pr-0'>Size</th>
						<th className='sm:w-1/12 md:text-base md:w-1/12 lg:w-1/12 text-left hidden sm:table-cell'>Type</th>
						<th className='sm:w-4/12 md:text-base md:w-3/12 lg:w-3/12 text-right pr-2 hidden sm:table-cell'>Upload Date</th>
					</tr>
				</thead>
				<tbody>
					{
						isCreateDirectoryFormDisplayed && (
							<CreateDirectoryForm
								onErrorSet={handleErrorSet}
								onDirectoryCreated={handleDirectoryCreated}
								onCancel={handleDirectoryCreationCancelled}
								parentDirectoryId={currentDirectoryId}/>
						)
					}
					{
						Array.from(fileItemMap.values()).map(item => (
							<FileListItem
								onErrorSet={handleErrorSet}
								onDirectoryClicked={async () => handleDirectoryEntered(item.id)}
								onFileNameChanged={onFileNameChanged}
								onFileSelect={() => handleFileSelected(item.id)}
								key={item.id}
								name={item.name}
								id={item.id}
								size={item.size}
								selected={selectedFiles.has(item.id)}
								uploadDate={new Date(item.uploadDate)}
								isDirectory={item.isDirectory}
								parentDirectoryId={item.parentDirectoryId ?? null}/>
						))
					}
				</tbody>
			</table>
		</main>
	)
}
