import { ChangeEvent, useState } from 'react';
import { JWT_STORAGE_KEY } from '../constants';
import { useRouter } from 'next/navigation';
import { CreateDirectoryFormProps } from './definitions';

export function CreateDirectoryForm(
    {
        parentDirectoryId,
        onDirectoryCreated,
        onCancel
    } : CreateDirectoryFormProps
) {
    const router = useRouter();
    const [directoryName, setDirectoryName] = useState<string>('');

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setDirectoryName(e.target.value)
    }

    const handleChangeNameCancelled = () => {
        onCancel();
    }

    const handleNameChangeSubmitted = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
            return;
        }

        if (e.key !== 'Enter') {
            return;
        }

        e.preventDefault();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/create-directory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parentDirectoryId: parentDirectoryId,
                name: directoryName
            }),
            credentials: 'include'
        })

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                router.push('/auth');
                return;
            }

            return;
        }

        setDirectoryName('')
        onDirectoryCreated();
    }

    return (
        <tr>
            <td></td>
            <td className='text-left'>
                {
                    <input
                        className='py-1 text-base w-full pl-1'
                        type='text'
                        value={directoryName}
                        onChange={handleNameChanged}
                        autoFocus
                        onBlur={handleChangeNameCancelled}
                        onKeyDown={handleNameChangeSubmitted}/>
                }
            </td>
            <td className='text-left'>0 KB</td>
            <td className='text-right'></td>
        </tr>
    );
}
