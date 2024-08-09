import { GetFilesResult, HttpResult } from "./models";

export const fetchAllFiles = async (directoryId: number | null): Promise<GetFilesResult> => {
	const url = directoryId == null
		? `${process.env.NEXT_PUBLIC_SERVER_URL}/files/`
		: `${process.env.NEXT_PUBLIC_SERVER_URL}/files/${directoryId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            return {
                message: `Failed to load files: authentication error`,
                files: [],
                rawResponse: response
            }
        } else {
            return {
                message: `Failed to load files: ${response.status} error`,
                files: [],
                rawResponse: response
            }
        }
    }

    return {
        message: '',
        rawResponse: response,
        files: await response.json(),
    }
}

export async function deleteFiles(selectedFiles: Set<number>): Promise<HttpResult> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileIds: Array.from(selectedFiles)
        }),
        credentials: 'include'
    });

    const message = response.ok
        ? ''
        : response.status === 401 || response.status === 403
            ? `Failed to delete ${selectedFiles.size} files: authentication error`
            : `Failed to delete ${selectedFiles.size} files: ${response.status} error`

    return {
        message: message,
        rawResponse: response
    };
}

export async function downloadFiles(selectedFiles: Set<number>): Promise<HttpResult> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/download`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileIds: Array.from(selectedFiles)
        }),
        credentials: 'include'
    });

    const message = response.ok
        ? ''
        : response.status === 401 || response.status === 403
            ? `Failed to download ${selectedFiles.size} files: authentication failed`
            : `Failed to download ${selectedFiles.size} files: ${response.status} error`;

    return {
        message: message,
        rawResponse: response
    };
}

export async function uploadFile(fileToUpload: File, parentDirectoryId: number | null): Promise<HttpResult> {
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('directoryFileId', JSON.stringify(parentDirectoryId));

    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });

    const message = response.ok
        ? ''
        : response.status === 401 || response.status === 403
            ? `Failed to upload file: authentication failed`
            : `Failed to upload file: ${response.status} error`;

    return {
        message: message,
        rawResponse: response
    };
}

export async function changeFileName(
    id: number,
    currentName: string,
    newName: string,
    parentDirectoryId: number | null
) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/update-name`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            newFileName: newName,
            parentDirectoryId: parentDirectoryId
        }),
        credentials: 'include'
    });

    const message = response.ok
        ? ''
        : response.status === 401 || response.status === 403
            ? `Failed to change name of '${currentName}': authentication failed`
            : `Failed to change name of '${currentName}': ${response.status} error`;

    return {
        message: message,
        rawResponse: response
    };
}

export async function createDirectory(parentDirectoryId: number | null, directoryName: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/create-directory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            parentDirectoryId: parentDirectoryId,
            name: directoryName
        }),
        credentials: 'include'
    });

    const message = response.ok
        ? ''
        : response.status === 401 || response.status === 403
            ? `Failed to change name of '${directoryName}': authentication failed`
            : `Failed to change name of '${directoryName}': ${response.status} error`;

    return {
        message: message,
        rawResponse: response
    };
}
