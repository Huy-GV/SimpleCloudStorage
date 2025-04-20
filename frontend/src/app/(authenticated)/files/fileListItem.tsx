import { ChangeEvent, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { faFolder } from '@fortawesome/free-solid-svg-icons/faFolder';

const dateFormat: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
};

const timeFormat: Intl.DateTimeFormatOptions = {
	hour12: true,
	hour: '2-digit',
	minute: '2-digit',
};

function getFileExtension(filename: string): string {
	const parts = filename.split('.');
	return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}


export interface FileItemProps {
	id: number;
	name: string;
	size: number;
	selected: boolean;
	uploadDate: Date;
	currentDirectoryId: number | null;
	isDirectory: boolean;
	onDirectoryClicked: () => void;
	onFileSelected: () => void;
	onFileNameChanged: (id: number, currentName: string, newName: string, currentDirectoryId: number | null) => void;
}

export default function FileListItem(
	{
		id,
		name,
		selected,
		uploadDate,
		size,
		isDirectory,
		currentDirectoryId,
		onDirectoryClicked,
		onFileSelected,
		onFileNameChanged,
	} : FileItemProps
) {
	const [isEditFormDisplayed, setIsEditFormDisplayed] = useState<boolean>(false);
	const [newName, setNewName] = useState<string>(name);

	const localDate = `${uploadDate.toLocaleDateString('en-GB', dateFormat)} ${uploadDate.toLocaleTimeString([], timeFormat)} `;

	const getFileSizeText = (sizeKb: number) => {
		if (isDirectory || Number.isNaN(size)) {
			return '- KB'
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

	const handleFileSelected = () => {
		onFileSelected();
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
			setNewName(name);
			e.preventDefault();
			return;
		}

		if (e.key !== 'Enter') {
			return;
		}

		e.preventDefault();
		if (newName.trim() === name) {
			setIsEditFormDisplayed(false);
			return
		}

		setIsEditFormDisplayed(false);
		onFileNameChanged(id, name, newName, currentDirectoryId);
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

	const fileSizeText = getFileSizeText(size);

	return (
		<tr
			className={
				`group/file-row hover:bg-blue-100 transition ease-in-out select-none
				${
					selected
						? 'bg-blue-100'
						: ''
				}
				${
					isDirectory
						? 'cursor-pointer'
						: ''
				}
				`}
			onClick={handleFileSelected}
			onDoubleClick={handleFileClicked}>
			<td className='py-1 pl-2 pr-1'>
				<input
					type='checkbox'
					className='w-8 h-8'
					onChange={handleFileSelected}
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
						<>
							<div className='flex flex-row flex-nowrap align-bottom sm:align-middle'>
								<span className='text-nowrap self-end sm:self-auto text-ellipsis whitespace-nowrap w-4/5 overflow-x-hidden'>
									{name}
								</span>
								<button
									className='transition ease-in-out  group-hover/file-row:visible ml-auto invisible flex items-center  hover:scale-110'
									onClick={handleFileNameClick}>
									<FontAwesomeIcon icon={faPenToSquare}/>
									<span className='ml-1 mr-1 font-semibold'>
										Edit
									</span>
								</button>
							</div>
							<dl className='sm:hidden'>
								<dt className='hidden'>Upload Date</dt>
								<dd className='text-gray-500 text-sm'>{ localDate }</dd>
							</dl>
						</>
				}
			</td>
			<td className='text-gray-500 text-sm sm:text-sm lg:text-base text-right pr-4 sm:text-left sm:pr-0'>{ fileSizeText }</td>
			<td className='text-gray-500 text-sm sm:text-sm lg:text-base text-left hidden sm:table-cell'>
				{
					isDirectory ? <FontAwesomeIcon icon={faFolder} /> : <span>{`.${getFileExtension(name)}`}</span>
				}
			</td>
			<td className='text-gray-500 text-sm sm:text-sm lg:text-base text-right hidden sm:table-cell sm:pr-2 whitespace-nowrap'>{ localDate }</td>
		</tr>
	);
}
