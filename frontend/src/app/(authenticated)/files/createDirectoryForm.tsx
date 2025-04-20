import { ChangeEvent, useState } from 'react';

interface CreateDirectoryFormProps  {
	onDirectoryCreated: (directoryName: string) => void;
	onCancel: () => void;
}

export default function CreateDirectoryForm(
    {
        onDirectoryCreated,
        onCancel,
    } : CreateDirectoryFormProps
) {
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
        setDirectoryName('');
        onDirectoryCreated(directoryName);
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
            <td className='text-right'></td>
            <td className='text-right'></td>
        </tr>
    );
}
