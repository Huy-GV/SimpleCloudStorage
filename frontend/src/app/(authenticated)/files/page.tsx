"use client"
import { useRef, useState } from 'react'
import FileListItem from "./fileListItem";
import FileUploadForm from "./fileUploadForm";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import CreateDirectoryForm from "./createDirectoryForm";
import FileBreadcrumbMenu from './fileBreadcrumbMenu';
import useFileManager from './useFileManager';
import useDirectoryManager from './useDirectoryManager';

export default function Page() {
	const downloadedFileRef = useRef<HTMLAnchorElement>(null);
	const [isCreateDirectoryFormDisplayed, setIsCreateDirectoryFormDisplayed] = useState<boolean>();

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
		const blob = await handleFilesDownloaded();
		if (blob) {
			clickDownloadLink(blob);
		}
	}

	const handleDirectoryCreationFormDisplayed = () => {
		setIsCreateDirectoryFormDisplayed(true)
	}

	const handleForwardDirectoryClicked = async (selectedDirectoryId: number) => {
		handleFilesDeselected();
		handleForwardDirectoryNav(selectedDirectoryId, fileMap.get(selectedDirectoryId)!.name);
		await handleFilesReloaded(selectedDirectoryId);
	}

	const handleBackwardDirectoryClicked = async (selectedDirectoryId: number | null) => {
		handleFilesDeselected();
		handleBackwardDirectoryNav(currentDirectoryId, selectedDirectoryId);
		await handleFilesReloaded(selectedDirectoryId);
	}

	const onFileUploaded = async (files: FileList) => {
		await handleFileUploaded(currentDirectoryId, files);
	};

	const handleNewDirectoryCreated = async (name: string) => {
		await handleDirectoryCreated(currentDirectoryId, name);
		await handleFilesReloaded(currentDirectoryId);
		setIsCreateDirectoryFormDisplayed(false);
	};

	const handleDirectoryCreationCancelled = async () => {
		setIsCreateDirectoryFormDisplayed(false);
	};

	const {
		fileMap,
		fileError,
		selectedFiles,
		handleFilesDownloaded,
		handleFilesReloaded,
		handleFilesDeselected,
		handleFileSelected,
		handleFileDeleted,
		handleFileNameChanged,
		handleFileUploaded,
	} = useFileManager();

	const {
		directoryError,
		currentDirectoryId,
		directoryChain,
		handleForwardDirectoryNav,
		handleBackwardDirectoryNav,
		handleDirectoryCreated,
	} = useDirectoryManager();

	return (
		<main className='flex flex-col w-screen sm:w-11/12 md:w-11/12 xl:w-4/6 mx-auto mb-16'>
			<FileBreadcrumbMenu directoryChain={directoryChain} onClick={handleBackwardDirectoryClicked} />
			<div className='flex flex-row gap-2 mb-4 m-4 pt-4 flex-wrap border-t border-slate-300'>
				<button
					className="bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer disabled:hover:cursor-default disabled:opacity-50 font-medium hover:bg-blue-900 transition-all duration-200 w-full sm:w-fit"
					onClick={handleDirectoryCreationFormDisplayed}>
					<FontAwesomeIcon icon={faPlus} />
					<span className='ml-2'>Add Folder</span>
				</button>
				<FileUploadForm
					onFileUploaded={onFileUploaded} />
				<button
					disabled={selectedFiles.size === 0}
					className="bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer disabled:hover:cursor-default disabled:opacity-50 font-medium disabled:hover:bg-blue-700 hover:bg-blue-900 transition-all duration-200 w-full sm:w-fit "
					onClick={handleFileDownload}>
					<FontAwesomeIcon icon={faDownload} />
					<span className='ml-2'>Download</span>
				</button>
				<button
					disabled={selectedFiles.size === 0}
					className="bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer disabled:hover:cursor-default disabled:opacity-50 font-medium disabled:hover:bg-blue-700 hover:bg-blue-900 transition-all duration-00 w-full sm:w-fit"
					onClick={() => handleFileDeleted(currentDirectoryId)}>
					<FontAwesomeIcon icon={faTrash} />
					<span className='ml-2'>Delete</span>
				</button>
				<a ref={downloadedFileRef}></a>
			</div>
			{
				fileError &&
				<p className='text-red-700 bg-red-50 p-3 m-4'>
					{fileError.message}
				</p>
			}			{
				directoryError &&
				<p className='text-red-700 bg-red-50 p-3 m-4'>
					{directoryError.message}
				</p>
			}

			<table className='border-collapse table-fixed mx-auto w-full bg-white p-4 rounded-md shadow-md'>
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
								onDirectoryCreated={(name: string) => handleNewDirectoryCreated(name)}
								onCancel={handleDirectoryCreationCancelled} />
						)
					}
					{
						Array.from(fileMap.values()).map(item => (
							<FileListItem
								onDirectoryClicked={async () => handleForwardDirectoryClicked(item.id)}
								onFileNameChanged={handleFileNameChanged}
								onFileSelected={() => handleFileSelected(item.id)}
								key={item.id}
								name={item.name}
								id={item.id}
								size={item.size}
								selected={selectedFiles.has(item.id)}
								uploadDate={new Date(item.uploadDate)}
								isDirectory={item.isDirectory}
								currentDirectoryId={item.parentDirectoryId ?? null}/>
						))
					}
					<tr className='h-3 border-t-2'>
						<td></td>
						<td></td>
						<td></td>
						<td></td>
						<td></td>
					</tr>
				</tbody>
			</table>
		</main>
	)
}
