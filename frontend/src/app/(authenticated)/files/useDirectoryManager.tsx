import { useState } from 'react';
import { DirectoryChainItem } from './types';
import { RequestError } from '@api/models';
import { createDirectory } from '@api/fileApis';
import useSignOutAfterDelay from './useSignOutAfterDelay';

export default function useDirectoryManager() {
    const signOutAfterDelay = useSignOutAfterDelay();
    const [currentDirectoryId, setCurrentDirectoryId] = useState<number | null>(null);
    const [error, setError] = useState<RequestError | null>(null);
    const [directoryChain, setDirectoryChain] = useState<DirectoryChainItem[]>([{
        id: null,
        name: "Home"
    }]);

    const handleForwardDirectoryNav = async (
        selectedDirectoryId: number,
        selectedDirectoryName: string
    ) => {
        setCurrentDirectoryId(selectedDirectoryId);
        setDirectoryChain((currentDirectoryChain) => [
            ...currentDirectoryChain,
            {
                id: selectedDirectoryId,
                name: selectedDirectoryName,
            },
        ]);
    };

    const handleBackwardDirectoryNav = async (
        currentDirectoryId: number | null,
        selectedDirectoryId: number | null,
    ) => {
        if (selectedDirectoryId == currentDirectoryId) {
            return;
        }

        setCurrentDirectoryId(selectedDirectoryId);

        setDirectoryChain(currentChain => {
            const index = currentChain.map(x => x.id).indexOf(selectedDirectoryId);
            return index === -1 ? currentChain : currentChain.slice(0, index + 1);
        })
    }

    const handleDirectoryCreated = async (currentDirectoryId: number | null, directoryName: string) => {
        const result = await createDirectory(currentDirectoryId, directoryName);
        if (!result.rawResponse?.ok ) {
            const statusCode = result.rawResponse?.status.toString() ?? 'unknown';
            setError({
                message: result.message,
                statusCode,
            });
            signOutAfterDelay(statusCode);

            return;
        }
    }

    return {
        directoryError: error,
        currentDirectoryId,
        directoryChain,
        handleForwardDirectoryNav,
        handleBackwardDirectoryNav,
        handleDirectoryCreated,
    };
};
