import { useCallback, useEffect, useState } from 'react';
import { FileItemMap, RequestError } from '@api/models';
import { changeFileName, deleteFiles, downloadFiles, fetchAllFiles, uploadFile } from '@api/fileApis';
import useSignOutAfterDelay from './useSignOutAfterDelay';

export default function useFileManager() {
    const signOutAfterDelay = useSignOutAfterDelay();
    const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
	const [fileItemMap, setFileItemMap] = useState<FileItemMap>(new Map());
    const [error, setError] = useState<RequestError | null>(null);

	const handleFilesReloaded = useCallback(async (directoryId: number | null) => {
		const result = await fetchAllFiles(directoryId);
        if (!result.rawResponse?.ok) {
            const statusCode = result.rawResponse?.status.toString() ?? 'unknown';
			setError({
				message: result.message,
				statusCode,
            });
            signOutAfterDelay(statusCode);
		} else {
			setFileItemMap(new Map(result.files.map(x => [x.id, x])))
            setError(null);
		}
    }, [signOutAfterDelay]);

    useEffect(() => {
        handleFilesReloaded(null)
    }, [handleFilesReloaded])

    const handleFilesDeselected = () => {
        setSelectedFiles(new Set());
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

    const handleFilesDownloaded = async () => {
		const result = await downloadFiles(selectedFiles);
		if (!result.rawResponse?.ok ) {
			setError({
				message: result.message,
				statusCode: result.rawResponse?.status.toString() ?? 'unknown'
            });
            return null;
		} else {
			const blob = await result.rawResponse.blob();
            setError(null);
            return blob
		}
    }

    const handleFileDeleted = async (currentDirectoryId: number | null) => {
        const result = await deleteFiles(selectedFiles);
        if (!(result.rawResponse?.ok ?? false)) {
            setError({
            	message: result.message,
            	statusCode: result.rawResponse?.status.toString() ?? 'unknown'
            });
        } else {
            setError(null);
            handleFilesDeselected();
            await handleFilesReloaded(currentDirectoryId);
        }
    }

    const handleFileNameChanged = async (
        id: number,
        currentName: string,
        newName: string,
        currentDirectoryId: number | null,
    ) => {
        const result = await changeFileName(id, currentName, newName, currentDirectoryId);
        if (!result.rawResponse?.ok) {
            const statusCode = result.rawResponse?.status.toString() ?? 'unknown';
            setError({
                message: result.message,
                statusCode,
            });
            signOutAfterDelay(statusCode);
        } else {
            setError(null);
            await handleFilesReloaded(currentDirectoryId);
        }
    }

    const handleFileUploaded = async (currentDirectoryId: number | null, files: FileList) => {
        const fileToUpload = files[0];
        if (!fileToUpload) {
            setError({
                message: "No file selected",
                statusCode: ""
            });
            return;
        }

        const result = await uploadFile(fileToUpload, currentDirectoryId);
        if (!result.rawResponse?.ok ) {
            const statusCode = result.rawResponse?.status.toString() ?? 'unknown';
            setError({
                message: result.message,
                statusCode,
            });
            signOutAfterDelay(statusCode);

            return;
        } else {
            setError(null);
            await handleFilesReloaded(currentDirectoryId);
        }
    }

    return {
        fileMap: fileItemMap,
        fileError: error,
        selectedFiles,
        handleFilesReloaded,
        handleFilesDownloaded,
        handleFilesDeselected,
        handleFileSelected,
        handleFileDeleted,
        handleFileNameChanged,
        handleFileUploaded,
    };
};
