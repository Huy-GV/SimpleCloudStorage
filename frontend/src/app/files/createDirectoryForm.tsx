import { ChangeEvent, useState } from 'react';
import styles from './files.module.css'
import { JWT_STORAGE_KEY, SERVER_URL } from '../constants';
import { useRouter } from 'next/navigation';
import { CreateDirectoryFormProps } from './definitions';

export function CreateDirectoryForm({ parentDirectoryId, onDirectoryCreated, onCancel } : CreateDirectoryFormProps) {
    const router = useRouter();
    const [directoryName, setDirectoryName] = useState<string>('');

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setDirectoryName(e.target.value)
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
        const response = await fetch(`${SERVER_URL}/files/create-directory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY]}`
            },
            body: JSON.stringify({
                parentDirectoryId: parentDirectoryId,
                name: directoryName
            })
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
            <td className={styles.alignLeftCol}>
                {
                    <>
                        <input
                            className={styles.changeNameInput}
                            type='text'
                            value={directoryName}
                            onChange={handleNameChanged}
                            onKeyDown={handleNameChangeSubmitted}></input>
                    </>
                }
            </td>
            <td className={styles.alignLeftCol}>0 KB</td>
            <td className={styles.alignRightCol}></td>
        </tr>
    );
}
