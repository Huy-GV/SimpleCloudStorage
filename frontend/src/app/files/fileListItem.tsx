import { ChangeEvent, useState } from 'react';
import { FileItemData } from './definitions';
import styles from './files.module.css'
import { JWT_STORAGE_KEY, SERVER_URL } from '../constants';
import { useRouter } from 'next/navigation';

export function FileListItem({ id, name, selected, onFileSelect, onFileNameChanged }: FileItemData) {
    const router = useRouter();
    const [isEditFormDisplayed, setIsEditFormDisplayed] = useState<boolean>(false);
    const [newName, setNewName] = useState<string>(name);

    const handleFileSelect = () => {
        onFileSelect();
    }

    const handleFileNameClick = () => {
        setIsEditFormDisplayed((isEditFormDisplayed) => !isEditFormDisplayed);
    }

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setNewName(e.target.value)
    }

    const handleNameChangeSubmitted = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            setIsEditFormDisplayed(false);
        }

        if (e.key !== 'Enter') {
            return;
        }

        e.preventDefault();
        setIsEditFormDisplayed(false);
        const response = await fetch(`${SERVER_URL}/files/update-name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY]}`
            },
            body: JSON.stringify({
                id: id,
                newFileName: newName
            })
        })

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                router.push('/auth');
                return;
            }

            return;
        }

        onFileNameChanged();
    }

    return (
        <tr className={selected ? styles.selectedRow : '#'}>
            <td>
                <input
                    type='checkbox'
                    className={styles.fileCheckbox}
                    onChange={handleFileSelect}
                    checked={selected}></input></td>
            <td className={styles.nameCol}>
                {
                    isEditFormDisplayed
                        ?
                        (
                            <>
                                <input
                                    className={styles.changeNameInput}
                                    type='text'
                                    value={newName}
                                    onChange={handleNameChanged}
                                    onKeyDown={handleNameChangeSubmitted}></input>
                            </>
                        )
                        :
                        <span onClick={handleFileNameClick}>
                            {name}
                        </span>
                }
            </td>
            <td className={styles.uploadDateCol}>unimplemented</td>
        </tr>
    );
}
