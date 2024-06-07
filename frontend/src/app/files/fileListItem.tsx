import { ChangeEvent, useState } from 'react';
import { FileItemProps } from './definitions';;
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

export function FileListItem(
	{
		id,
		name,
		selected,
		uploadDate,
		size,
		isDirectory,
		parentDirectoryId,
		onDirectoryClicked,
		onFileSelect,
		onFileNameChanged
	} : FileItemProps
) {
	const router = useRouter();
	const [isEditFormDisplayed, setIsEditFormDisplayed] = useState<boolean>(false);
	const [newName, setNewName] = useState<string>(name);

	const timeFormat = {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
	} as const;

	const localDate = `${uploadDate.toLocaleTimeString([], timeFormat)} ${uploadDate.getDate()}/${uploadDate.getMonth()}/${uploadDate.getFullYear()}`;

	const getFileTypeText = (isDirectory: boolean) => {
		return isDirectory ? 'Folder' : 'File'
	}

	const getFileSizeText = (sizeKb: number) => {
		if (isDirectory || Number.isNaN(size)) {
			return '-'
		}

		if (sizeKb < 1) {
			return '<1 KB'
		}

		if (sizeKb <= 1024) {
			return `${Math.round(sizeKb)} KB`
		}

		// 1048576 = 1024 * 1024
		if (sizeKb > 1024 && sizeKb < 1048576) {
			return `${Math.round(sizeKb / 1024)} MB`
		}

		return `${Math.round(sizeKb / 1048576)} GB`
	}

	const handleFileSelect = () => {
		onFileSelect();
	}

	const handleFileNameClick = () => {
		setIsEditFormDisplayed(true);
	}

	const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
		setNewName(e.target.value)
	}

	const handleNameChangeSubmitted = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			setIsEditFormDisplayed(false);
			e.preventDefault();
			return;
		}

		if (e.key !== 'Enter') {
			return;
		}

		e.preventDefault();
		setIsEditFormDisplayed(false);

		const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/update-name`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('Jwt')}`
			},
			body: JSON.stringify({
				id: id,
				newFileName: newName,
				parentDirectoryId: parentDirectoryId
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

		onFileNameChanged();
	}

	const handleFileClicked = (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
		e.preventDefault();
		if (isDirectory) {
			onDirectoryClicked()
		}
	}

	const handleNameInputFocusLost = () => {
		setIsEditFormDisplayed(false);
	}

	return (
		<tr
			className={`group/file-row hover:bg-blue-100 transition ease-in-out select-none ${selected ? 'bg-blue-100' : ''} ${isDirectory ? 'cursor-pointer' : ''}`}
			onDoubleClick={handleFileClicked}>
			<td className='py-2 px-1'>
				<input
					type='checkbox'
					className='w-8 h-8'
					onChange={handleFileSelect}
					checked={selected}/>
			</td>
			<td className='text-left'>
				{
					isEditFormDisplayed
						?
						<input
							className='py-1 text-base w-full pl-1'
							type='text'
							value={newName}
							autoFocus
							onBlur={handleNameInputFocusLost}
							onChange={handleNameChanged}
							onKeyDown={handleNameChangeSubmitted}/>
						:
						<div className='flex flex-row'>
							<span className='text-nowrap text-ellipsis whitespace-nowrap w-4/5 overflow-x-hidden'>
								{name}
							</span>
							<button
								className='transition ease-in-out group-hover/file-row:visible ml-auto invisible'
								onClick={handleFileNameClick}>
								<FontAwesomeIcon icon={faPenToSquare}/>
								<span className='ml-3 mr-1 font-semibold'>
									Edit
								</span>
							</button>
						</div>

				}
			</td>
			<td className='text-left'>{ getFileSizeText(size) }</td>
			<td className='text-left'>{ getFileTypeText(isDirectory) }</td>
			<td className='text-right'>{ localDate }</td>
		</tr>
	);
}
