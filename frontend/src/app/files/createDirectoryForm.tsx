import { ChangeEvent, useState } from 'react';
import { CreateDirectoryFormProps } from './models';
import { createDirectory } from '../../api/fileApis';

export function CreateDirectoryForm(
    {
        parentDirectoryId,
        onDirectoryCreated,
        onCancel,
        onErrorSet,
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
        const result = await createDirectory(parentDirectoryId, directoryName);
        if (!result.rawResponse?.ok) {
			onErrorSet({
				message: result.message,
				statusCode: result.rawResponse?.status.toString() ?? 'unknown'
			});

            return;
		}

        onErrorSet(null);
        setDirectoryName('');
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
            <td className='text-right'></td>
            <td className='text-right'></td>
        </tr>
    );
}
